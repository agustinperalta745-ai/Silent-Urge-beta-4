const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, authorization",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function roomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(7);
  crypto.getRandomValues(bytes);
  return [...bytes].map((b) => alphabet[b % alphabet.length]).join("");
}

async function readBody(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: JSON_HEADERS });

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";

    if (path === "/" || path === "/health") {
      return json({ ok: true, service: "el-mister-online", version: 1 });
    }

    if (path === "/api/rooms" && request.method === "POST") {
      const body = await readBody(request);
      const name = String(body.name || "DT local").trim().slice(0, 30) || "DT local";
      const playerId = String(body.playerId || crypto.randomUUID()).trim();
      const code = roomCode();
      const id = env.MATCH_ROOMS.idFromName(code);
      const stub = env.MATCH_ROOMS.get(id);
      const response = await stub.fetch("https://room/internal/init", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code, name, playerId }),
      });
      const payload = await response.json();
      return json(payload, response.status);
    }

    const match = path.match(/^\/api\/rooms\/([A-Z0-9]{7})(\/.*)?$/i);
    if (!match) return json({ error: "not_found", message: "Ruta inexistente." }, 404);

    const code = match[1].toUpperCase();
    const tail = match[2] || "";
    const id = env.MATCH_ROOMS.idFromName(code);
    const stub = env.MATCH_ROOMS.get(id);

    if (tail === "/ws" && request.headers.get("Upgrade") === "websocket") {
      const token = url.searchParams.get("token") || "";
      return stub.fetch(`https://room/ws?token=${encodeURIComponent(token)}`, request);
    }

    const target = tail || "/state";
    const body = request.method === "GET" ? undefined : await request.text();
    const response = await stub.fetch(`https://room${target}`, {
      method: request.method,
      headers: request.headers,
      body,
    });

    if (response.status === 101) return response;
    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: JSON_HEADERS,
    });
  },
};

export class MatchRoom {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.env = env;
  }

  async load() {
    return (await this.ctx.storage.get("state")) || null;
  }

  async save(state) {
    state.updatedAt = Date.now();
    await this.ctx.storage.put("state", state);
  }

  publicState(state) {
    if (!state) return null;
    return {
      code: state.code,
      mode: state.mode,
      status: state.status,
      createdAt: state.createdAt,
      updatedAt: state.updatedAt,
      players: state.players.map((p) => ({ slot: p.slot, id: p.id, name: p.name })),
      penalties: {
        totalKicks: state.penalties.totalKicks,
        shooterSlot: state.penalties.shooterSlot,
        score: [...state.penalties.score],
        kicks: state.penalties.kicks,
        waitingForShot: !state.penalties.pending.shot,
        waitingForDive: !state.penalties.pending.dive,
        winnerSlot: state.penalties.winnerSlot,
      },
    };
  }

  tokenPlayer(state, token) {
    return state.players.find((p) => p.token === token) || null;
  }

  broadcast(state, type = "state") {
    const payload = JSON.stringify({ type, state: this.publicState(state) });
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(payload);
      } catch {}
    }
  }

  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/internal/init" && request.method === "POST") {
      let state = await this.load();
      const body = await readBody(request);
      if (!state) {
        const token = crypto.randomUUID() + crypto.randomUUID();
        state = {
          code: String(body.code || "").toUpperCase(),
          mode: "penalties",
          status: "waiting",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          players: [{ slot: 0, id: String(body.playerId), name: String(body.name), token }],
          penalties: {
            totalKicks: 0,
            shooterSlot: 0,
            score: [0, 0],
            kicks: [],
            pending: { shot: null, dive: null },
            winnerSlot: null,
          },
        };
        await this.save(state);
        return json({ ok: true, code: state.code, token, slot: 0, state: this.publicState(state) });
      }
      const host = state.players[0];
      return json({ ok: true, code: state.code, token: host.token, slot: 0, state: this.publicState(state) });
    }

    const state = await this.load();
    if (!state) return json({ error: "room_not_found", message: "La sala no existe." }, 404);

    if (path === "/state" && request.method === "GET") {
      return json({ ok: true, state: this.publicState(state) });
    }

    if (path === "/join" && request.method === "POST") {
      const body = await readBody(request);
      const name = String(body.name || "DT visitante").trim().slice(0, 30) || "DT visitante";
      const playerId = String(body.playerId || crypto.randomUUID()).trim();
      let player = state.players.find((p) => p.id === playerId);
      if (!player) {
        if (state.players.length >= 2) return json({ error: "room_full", message: "La sala ya tiene dos DT." }, 409);
        player = { slot: 1, id: playerId, name, token: crypto.randomUUID() + crypto.randomUUID() };
        state.players.push(player);
        state.status = "playing";
        await this.save(state);
        this.broadcast(state, "player_joined");
      }
      return json({ ok: true, code: state.code, token: player.token, slot: player.slot, state: this.publicState(state) });
    }

    if (path === "/penalty/choice" && request.method === "POST") {
      if (state.status !== "playing") {
        return json({ error: "not_playing", message: state.status === "waiting" ? "Todavía falta el segundo DT." : "La tanda ya terminó." }, 409);
      }
      const body = await readBody(request);
      const token = String(body.token || "");
      const player = this.tokenPlayer(state, token);
      if (!player) return json({ error: "unauthorized", message: "Jugador inválido para esta sala." }, 401);

      const shooterSlot = state.penalties.shooterSlot;
      const isShooter = player.slot === shooterSlot;
      const direction = Number(body.direction);
      if (!Number.isInteger(direction) || direction < 0 || direction > 7) {
        return json({ error: "bad_direction", message: "Elegí una dirección válida." }, 400);
      }

      if (isShooter) {
        if (state.penalties.pending.shot) return json({ error: "already_locked", message: "Tu remate ya quedó confirmado." }, 409);
        const timing = Math.max(0, Math.min(1, Number(body.timing ?? 0.5)));
        state.penalties.pending.shot = { slot: player.slot, direction, timing };
      } else {
        if (state.penalties.pending.dive) return json({ error: "already_locked", message: "Tu atajada ya quedó confirmada." }, 409);
        state.penalties.pending.dive = { slot: player.slot, direction };
      }

      let resolved = null;
      if (state.penalties.pending.shot && state.penalties.pending.dive) {
        resolved = this.resolveKick(state);
      }
      await this.save(state);
      this.broadcast(state, resolved ? "kick_resolved" : "choice_locked");
      return json({ ok: true, resolved, state: this.publicState(state) });
    }

    if (path === "/rematch" && request.method === "POST") {
      const body = await readBody(request);
      const player = this.tokenPlayer(state, String(body.token || ""));
      if (!player) return json({ error: "unauthorized", message: "Jugador inválido para esta sala." }, 401);
      if (state.players.length < 2) return json({ error: "missing_player", message: "Todavía falta el segundo DT." }, 409);
      state.status = "playing";
      state.penalties = {
        totalKicks: 0,
        shooterSlot: state.penalties.totalKicks % 2 === 0 ? 1 - player.slot : player.slot,
        score: [0, 0],
        kicks: [],
        pending: { shot: null, dive: null },
        winnerSlot: null,
      };
      await this.save(state);
      this.broadcast(state, "rematch");
      return json({ ok: true, state: this.publicState(state) });
    }

    if (path === "/ws" && request.headers.get("Upgrade") === "websocket") {
      const token = url.searchParams.get("token") || "";
      const player = this.tokenPlayer(state, token);
      if (!player) return json({ error: "unauthorized", message: "Token de sala inválido." }, 401);
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);
      this.ctx.acceptWebSocket(server);
      server.serializeAttachment({ slot: player.slot });
      server.send(JSON.stringify({ type: "state", state: this.publicState(state) }));
      return new Response(null, { status: 101, webSocket: client });
    }

    return json({ error: "not_found", message: "Acción inexistente." }, 404);
  }

  resolveKick(state) {
    const shot = state.penalties.pending.shot;
    const dive = state.penalties.pending.dive;
    const shooterSlot = shot.slot;
    const keeperSlot = dive.slot;
    const sameDirection = shot.direction === dive.direction;
    const timing = shot.timing;

    let goalChance = 0.70 + timing * 0.22;
    if (sameDirection) goalChance -= 0.46;
    if (timing < 0.12) goalChance -= 0.22;
    goalChance = Math.max(0.08, Math.min(0.97, goalChance));

    const rollBytes = new Uint32Array(1);
    crypto.getRandomValues(rollBytes);
    const roll = rollBytes[0] / 0xffffffff;
    const goal = roll < goalChance;
    let outcome = "goal";
    if (!goal) outcome = sameDirection && timing >= 0.12 ? "saved" : "missed";
    if (goal) state.penalties.score[shooterSlot] += 1;

    state.penalties.totalKicks += 1;
    const kick = {
      number: state.penalties.totalKicks,
      shooterSlot,
      keeperSlot,
      shotDirection: shot.direction,
      diveDirection: dive.direction,
      timing: Number(timing.toFixed(3)),
      outcome,
      score: [...state.penalties.score],
    };
    state.penalties.kicks.push(kick);
    state.penalties.pending = { shot: null, dive: null };
    state.penalties.shooterSlot = 1 - shooterSlot;

    const kicks = state.penalties.totalKicks;
    const pairComplete = kicks % 2 === 0;
    if (kicks >= 10 && pairComplete && state.penalties.score[0] !== state.penalties.score[1]) {
      state.status = "finished";
      state.penalties.winnerSlot = state.penalties.score[0] > state.penalties.score[1] ? 0 : 1;
    }
    return kick;
  }

  webSocketClose(ws, code, reason) {
    try {
      ws.close(code, reason);
    } catch {}
  }
}
