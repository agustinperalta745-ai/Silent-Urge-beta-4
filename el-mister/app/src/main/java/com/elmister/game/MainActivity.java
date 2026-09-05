package com.elmister.game;

import android.app.Activity;
import android.os.Bundle;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Spinner;
import android.widget.TextView;
import android.widget.Toast;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Random;
import java.util.Set;

public class MainActivity extends Activity {

    private static final int BG = Color.rgb(10, 20, 17);
    private static final int PANEL = Color.rgb(18, 34, 29);
    private static final int PANEL_2 = Color.rgb(25, 46, 39);
    private static final int TEXT = Color.rgb(240, 246, 243);
    private static final int MUTED = Color.rgb(166, 185, 177);
    private static final int ACCENT = Color.rgb(73, 190, 125);
    private static final int ACCENT_DARK = Color.rgb(41, 139, 87);
    private static final int DANGER = Color.rgb(218, 92, 92);

    private SharedPreferences prefs;
    private FrameLayout content;
    private TextView sectionTitle;
    private TextView sectionSub;
    private final List<Player> players = new ArrayList<>();
    private final Random random = new Random();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(BG);
        getWindow().setNavigationBarColor(BG);
        prefs = getSharedPreferences("el_mister_v01", MODE_PRIVATE);
        seedPlayers();
        ensureInitialState();
        buildShell();
        showHome();
    }

    private void seedPlayers() {
        players.clear();
        players.addAll(Arrays.asList(
                new Player("Bruno Sosa", "ARQ", 80),
                new Player("Lautaro Benítez", "LD", 78),
                new Player("Ramiro Ferreyra", "DFC", 81),
                new Player("Mateo Quiroga", "DFC", 82),
                new Player("Iván Cabrera", "LI", 79),
                new Player("Nicolás Vera", "MCD", 80),
                new Player("Franco Ledesma", "MC", 82),
                new Player("Julián Moretti", "MP", 83),
                new Player("Tomás Acuña", "ED", 84),
                new Player("Santino Paz", "EI", 81),
                new Player("Benjamín Ríos", "DC", 84),
                new Player("Facundo Paredes", "ARQ", 74),
                new Player("Ezequiel Molina", "DFC", 76),
                new Player("Agustín Correa", "MC", 77),
                new Player("Thiago Luna", "MP", 78),
                new Player("Máximo Duarte", "DC", 79),
                new Player("Valentín Suárez", "EI", 76),
                new Player("Lucas Arce", "LD", 75)
        ));
    }

    private void ensureInitialState() {
        if (!prefs.contains("morale")) {
            prefs.edit()
                    .putInt("morale", 72)
                    .putInt("discipline", 64)
                    .putInt("board", 68)
                    .putString("formation", "4-2-3-1")
                    .putString("mentality", "Balanceada")
                    .apply();
        }
        if (!prefs.contains("lineup_initialized")) {
            Set<String> starters = new HashSet<>();
            for (int i = 0; i < 11; i++) starters.add(players.get(i).name);
            prefs.edit().putStringSet("starters", starters).putBoolean("lineup_initialized", true).apply();
        }
    }

    private void buildShell() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(BG);

        LinearLayout header = new LinearLayout(this);
        header.setOrientation(LinearLayout.VERTICAL);
        header.setPadding(dp(18), dp(14), dp(18), dp(12));

        TextView brand = label("EL MÍSTER", 22, TEXT, true);
        TextView tagline = label("Tu club. Tus decisiones. Tu historia.", 12, MUTED, false);
        sectionTitle = label("", 18, TEXT, true);
        sectionSub = label("", 12, MUTED, false);
        header.addView(brand);
        header.addView(tagline);
        addGap(header, 12);
        header.addView(sectionTitle);
        header.addView(sectionSub);
        root.addView(header, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        content = new FrameLayout(this);
        root.addView(content, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        LinearLayout nav = new LinearLayout(this);
        nav.setOrientation(LinearLayout.HORIZONTAL);
        nav.setPadding(dp(8), dp(8), dp(8), dp(10));
        nav.setBackgroundColor(Color.rgb(13, 27, 23));

        nav.addView(navButton("Inicio", v -> showHome()), navParams());
        nav.addView(navButton("Plantel", v -> showSquad()), navParams());
        nav.addView(navButton("Decisiones", v -> showDecision()), navParams());
        nav.addView(navButton("Partido", v -> showMatch()), navParams());
        root.addView(nav);

        setContentView(root);
    }

    private LinearLayout.LayoutParams navParams() {
        LinearLayout.LayoutParams p = new LinearLayout.LayoutParams(0, dp(48), 1f);
        p.setMargins(dp(3), 0, dp(3), 0);
        return p;
    }

    private Button navButton(String text, View.OnClickListener listener) {
        Button b = new Button(this);
        b.setText(text);
        b.setTextSize(11);
        b.setTextColor(TEXT);
        b.setAllCaps(false);
        b.setPadding(dp(3), 0, dp(3), 0);
        b.setBackground(makeBg(PANEL_2, 12, 0, 0));
        b.setOnClickListener(listener);
        return b;
    }

    private void showHome() {
        sectionTitle.setText("Oficina del DT");
        sectionSub.setText("Semana 3 · Liga Nacional");
        LinearLayout body = body();

        LinearLayout club = card();
        club.addView(label("CLUB ATLÉTICO DEL SUR", 19, TEXT, true));
        club.addView(label("Objetivo: terminar entre los 6 primeros", 12, MUTED, false));
        addGap(club, 14);

        LinearLayout metrics = new LinearLayout(this);
        metrics.setOrientation(LinearLayout.HORIZONTAL);
        metrics.addView(metric("Moral", prefs.getInt("morale", 72)), equal());
        metrics.addView(metric("Disciplina", prefs.getInt("discipline", 64)), equal());
        metrics.addView(metric("Directiva", prefs.getInt("board", 68)), equal());
        club.addView(metrics);
        body.addView(club);
        addGap(body, 12);

        LinearLayout next = card();
        next.addView(label("PRÓXIMO PARTIDO", 12, ACCENT, true));
        addGap(next, 5);
        next.addView(label("Atlético del Sur  vs  Real Bahía", 18, TEXT, true));
        next.addView(label("Jornada 3 · Estadio del Sur", 12, MUTED, false));
        addGap(next, 12);
        next.addView(label("Sistema: " + prefs.getString("formation", "4-2-3-1") + " · " + prefs.getString("mentality", "Balanceada"), 12, TEXT, false));
        addGap(next, 10);
        Button prep = actionButton("Preparar alineación", true);
        prep.setOnClickListener(v -> showSquad());
        next.addView(prep);
        body.addView(next);
        addGap(body, 12);

        if (!prefs.getBoolean("decision_done", false)) {
            LinearLayout alert = card();
            alert.setBackground(makeBg(Color.rgb(54, 45, 24), 16, 1, Color.rgb(116, 96, 42)));
            alert.addView(label("SITUACIÓN PENDIENTE", 12, Color.rgb(241, 197, 91), true));
            alert.addView(label("Un jugador importante está generando tensión por sus llegadas tarde.", 14, TEXT, true));
            addGap(alert, 10);
            Button decide = actionButton("Tomar una decisión", false);
            decide.setOnClickListener(v -> showDecision());
            alert.addView(decide);
            body.addView(alert);
            addGap(body, 12);
        }

        String last = prefs.getString("last_match", "");
        if (!last.isEmpty()) {
            LinearLayout result = card();
            result.addView(label("ÚLTIMO PARTIDO", 12, ACCENT, true));
            result.addView(label(firstLine(last), 18, TEXT, true));
            addGap(result, 8);
            Button details = actionButton("Ver resumen", false);
            details.setOnClickListener(v -> showMatch());
            result.addView(details);
            body.addView(result);
        }

        setPage(scroll(body));
    }

    private void showSquad() {
        sectionTitle.setText("Plantel y táctica");
        sectionSub.setText("Elegí los 11 titulares y el plan de partido");
        LinearLayout body = body();

        LinearLayout tactic = card();
        tactic.addView(label("PLAN DE PARTIDO", 12, ACCENT, true));
        addGap(tactic, 8);
        tactic.addView(label("Formación", 12, MUTED, false));
        Spinner formation = spinner(new String[]{"4-2-3-1", "4-3-3", "4-4-2"}, prefs.getString("formation", "4-2-3-1"));
        tactic.addView(formation);
        addGap(tactic, 8);
        tactic.addView(label("Mentalidad", 12, MUTED, false));
        Spinner mentality = spinner(new String[]{"Balanceada", "Ofensiva", "Defensiva"}, prefs.getString("mentality", "Balanceada"));
        tactic.addView(mentality);
        addGap(tactic, 10);
        Button save = actionButton("Guardar táctica", true);
        save.setOnClickListener(v -> {
            prefs.edit().putString("formation", formation.getSelectedItem().toString())
                    .putString("mentality", mentality.getSelectedItem().toString()).apply();
            Toast.makeText(this, "Táctica guardada", Toast.LENGTH_SHORT).show();
            showSquad();
        });
        tactic.addView(save);
        body.addView(tactic);
        addGap(body, 12);

        Set<String> starters = new HashSet<>(prefs.getStringSet("starters", new HashSet<>()));
        LinearLayout lineup = card();
        lineup.addView(label("TITULARES " + starters.size() + "/11", 13, starters.size() == 11 ? ACCENT : DANGER, true));
        lineup.addView(label("Tocá el botón de cada jugador para cambiar su rol.", 12, MUTED, false));
        addGap(lineup, 8);

        for (Player p : players) {
            boolean unavailable = p.name.equals("Tomás Acuña") && prefs.getBoolean("acuna_out_next", false);
            LinearLayout row = new LinearLayout(this);
            row.setGravity(Gravity.CENTER_VERTICAL);
            row.setPadding(0, dp(7), 0, dp(7));

            TextView info = label(p.name + "\n" + p.pos + " · " + p.ovr + " OVR" + (unavailable ? " · FUERA" : ""), 13, unavailable ? MUTED : TEXT, false);
            row.addView(info, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

            Button toggle = miniButton(starters.contains(p.name) ? "Titular" : "Suplente", starters.contains(p.name));
            toggle.setEnabled(!unavailable);
            toggle.setOnClickListener(v -> {
                Set<String> current = new HashSet<>(prefs.getStringSet("starters", new HashSet<>()));
                if (current.contains(p.name)) {
                    current.remove(p.name);
                } else {
                    if (current.size() >= 11) {
                        Toast.makeText(this, "Ya hay 11 titulares. Sacá uno primero.", Toast.LENGTH_SHORT).show();
                        return;
                    }
                    current.add(p.name);
                }
                prefs.edit().putStringSet("starters", current).apply();
                showSquad();
            });
            row.addView(toggle, new LinearLayout.LayoutParams(dp(92), dp(42)));
            lineup.addView(row);
        }
        body.addView(lineup);
        setPage(scroll(body));
    }

    private void showDecision() {
        sectionTitle.setText("Decisiones");
        sectionSub.setText("Lo que hagas construye tu perfil como DT");
        LinearLayout body = body();

        if (prefs.getBoolean("decision_done", false)) {
            LinearLayout done = card();
            done.addView(label("DECISIÓN TOMADA", 12, ACCENT, true));
            addGap(done, 8);
            done.addView(label(prefs.getString("decision_outcome", "La decisión ya fue registrada."), 15, TEXT, false));
            addGap(done, 12);
            done.addView(label("Consecuencias actuales", 12, MUTED, true));
            done.addView(label("Moral " + prefs.getInt("morale", 72) + " · Disciplina " + prefs.getInt("discipline", 64) + " · Directiva " + prefs.getInt("board", 68), 13, TEXT, false));
            addGap(done, 12);
            Button reset = actionButton("Generar otra situación de prueba", false);
            reset.setOnClickListener(v -> {
                prefs.edit().putBoolean("decision_done", false).remove("decision_outcome").apply();
                showDecision();
            });
            done.addView(reset);
            body.addView(done);
            setPage(scroll(body));
            return;
        }

        LinearLayout story = card();
        story.addView(label("VESTUARIO · DISCIPLINA", 12, Color.rgb(241, 197, 91), true));
        addGap(story, 7);
        story.addView(label("Acuña vuelve a llegar tarde", 19, TEXT, true));
        addGap(story, 7);
        story.addView(label("Tomás Acuña, una de las figuras del equipo, llegó tarde a tres entrenamientos y a la última concentración. Varios compañeros creen que recibe un trato especial.", 14, TEXT, false));
        addGap(story, 12);
        story.addView(label("¿Qué hacés, míster?", 14, TEXT, true));
        addGap(story, 10);

        Button hard = actionButton("A · Dejarlo fuera del próximo partido", true);
        hard.setOnClickListener(v -> applyDecision(true));
        story.addView(hard);
        addGap(story, 8);
        story.addView(label("Disciplina ↑ · Moral del jugador ↓ · La directiva valora la firmeza", 11, MUTED, false));
        addGap(story, 14);

        Button soft = actionButton("B · Hablar en privado y mantenerlo", false);
        soft.setOnClickListener(v -> applyDecision(false));
        story.addView(soft);
        addGap(story, 8);
        story.addView(label("Moral ↑ · Disciplina del grupo ↓ · Acuña seguirá disponible", 11, MUTED, false));
        body.addView(story);
        setPage(scroll(body));
    }

    private void applyDecision(boolean hardLine) {
        int morale = prefs.getInt("morale", 72);
        int discipline = prefs.getInt("discipline", 64);
        int board = prefs.getInt("board", 68);
        SharedPreferences.Editor e = prefs.edit();
        String outcome;
        if (hardLine) {
            morale = clamp(morale - 4);
            discipline = clamp(discipline + 8);
            board = clamp(board + 3);
            outcome = "Elegiste la mano dura. Acuña queda fuera del próximo partido. El vestuario entiende que las reglas son para todos, aunque la relación con la figura se enfría.";
            e.putBoolean("acuna_out_next", true);
            Set<String> starters = new HashSet<>(prefs.getStringSet("starters", new HashSet<>()));
            starters.remove("Tomás Acuña");
            e.putStringSet("starters", starters);
        } else {
            morale = clamp(morale + 5);
            discipline = clamp(discipline - 6);
            board = clamp(board - 1);
            outcome = "Protegiste a Acuña y hablaste con él en privado. El jugador responde bien, pero parte del plantel siente que a las figuras se les permite más.";
            e.putBoolean("acuna_out_next", false);
        }
        e.putInt("morale", morale)
                .putInt("discipline", discipline)
                .putInt("board", board)
                .putBoolean("decision_done", true)
                .putString("decision_outcome", outcome)
                .apply();
        showDecision();
    }

    private void showMatch() {
        sectionTitle.setText("Centro de partido");
        sectionSub.setText("La simulación usa plantel, táctica, moral y disciplina");
        LinearLayout body = body();

        Set<String> starters = new HashSet<>(prefs.getStringSet("starters", new HashSet<>()));
        LinearLayout prep = card();
        prep.addView(label("ATLÉTICO DEL SUR vs REAL BAHÍA", 18, TEXT, true));
        prep.addView(label(prefs.getString("formation", "4-2-3-1") + " · " + prefs.getString("mentality", "Balanceada") + " · " + starters.size() + "/11 titulares", 12, MUTED, false));
        addGap(prep, 10);
        if (starters.size() != 11) {
            prep.addView(label("Necesitás exactamente 11 titulares para simular.", 13, DANGER, true));
            addGap(prep, 8);
            Button fix = actionButton("Corregir alineación", false);
            fix.setOnClickListener(v -> showSquad());
            prep.addView(fix);
        } else {
            Button sim = actionButton("Simular partido", true);
            sim.setOnClickListener(v -> simulateMatch());
            prep.addView(sim);
        }
        body.addView(prep);

        String last = prefs.getString("last_match", "");
        if (!last.isEmpty()) {
            addGap(body, 12);
            LinearLayout report = card();
            report.addView(label("ÚLTIMA SIMULACIÓN", 12, ACCENT, true));
            addGap(report, 8);
            TextView matchText = label(last, 13, TEXT, false);
            matchText.setLineSpacing(0f, 1.18f);
            report.addView(matchText);
            body.addView(report);
        }
        setPage(scroll(body));
    }

    private void simulateMatch() {
        Set<String> starters = new HashSet<>(prefs.getStringSet("starters", new HashSet<>()));
        if (starters.size() != 11) {
            Toast.makeText(this, "Elegí 11 titulares", Toast.LENGTH_SHORT).show();
            return;
        }

        double avg = 0;
        List<Player> startingPlayers = new ArrayList<>();
        for (Player p : players) {
            if (starters.contains(p.name)) {
                avg += p.ovr;
                startingPlayers.add(p);
            }
        }
        avg /= Math.max(1, startingPlayers.size());

        int morale = prefs.getInt("morale", 72);
        int discipline = prefs.getInt("discipline", 64);
        int board = prefs.getInt("board", 68);
        String mentality = prefs.getString("mentality", "Balanceada");

        double teamPower = avg + (morale - 50) * 0.045 + (discipline - 50) * 0.025;
        double opponentPower = 80.5 + random.nextDouble() * 2.0 - 1.0;
        double attackBias = mentality.equals("Ofensiva") ? 0.018 : mentality.equals("Defensiva") ? -0.012 : 0.0;
        double concedeBias = mentality.equals("Ofensiva") ? 0.010 : mentality.equals("Defensiva") ? -0.010 : 0.0;

        int home = 0;
        int away = 0;
        List<String> events = new ArrayList<>();
        for (int minute = 4; minute <= 90; minute += 3) {
            double ourChance = 0.045 + (teamPower - opponentPower) * 0.0022 + attackBias;
            double theirChance = 0.041 + (opponentPower - teamPower) * 0.0020 + concedeBias;
            ourChance = Math.max(0.018, Math.min(0.095, ourChance));
            theirChance = Math.max(0.018, Math.min(0.090, theirChance));

            if (random.nextDouble() < ourChance) {
                home++;
                Player scorer = pickScorer(startingPlayers);
                events.add(minute + "'  GOL · " + scorer.name + " para Atlético del Sur");
            }
            if (random.nextDouble() < theirChance) {
                away++;
                String[] rivals = {"M. Silva", "D. Navarro", "J. Torres", "L. Campos", "R. Funes"};
                events.add(minute + "'  Gol de Real Bahía · " + rivals[random.nextInt(rivals.length)]);
            }
            if (random.nextDouble() < 0.028) {
                Player booked = startingPlayers.get(random.nextInt(startingPlayers.size()));
                events.add(minute + "'  Amarilla · " + booked.name);
            }
        }

        if (events.isEmpty()) events.add("Partido cerrado, con pocas situaciones claras.");

        int shotsHome = Math.max(home + 3, 7 + random.nextInt(8) + (mentality.equals("Ofensiva") ? 2 : 0));
        int shotsAway = Math.max(away + 3, 6 + random.nextInt(8) + (mentality.equals("Defensiva") ? -1 : 0));
        int possHome = clampRange((int) Math.round(50 + (teamPower - opponentPower) * 0.7 + random.nextGaussian() * 3), 38, 62);
        int possAway = 100 - possHome;

        StringBuilder sb = new StringBuilder();
        sb.append("Atlético del Sur ").append(home).append(" - ").append(away).append(" Real Bahía\n");
        sb.append("\n");
        for (String event : events) sb.append(event).append("\n");
        sb.append("\nESTADÍSTICAS\n");
        sb.append("Posesión: ").append(possHome).append("% - ").append(possAway).append("%\n");
        sb.append("Tiros: ").append(shotsHome).append(" - ").append(shotsAway).append("\n");
        sb.append("Nivel inicial: ").append(String.format(Locale.US, "%.1f", avg)).append(" OVR\n");
        sb.append("Mentalidad: ").append(mentality);

        if (home > away) {
            morale = clamp(morale + 4);
            board = clamp(board + 3);
        } else if (home < away) {
            morale = clamp(morale - 4);
            board = clamp(board - 2);
        } else {
            morale = clamp(morale + 1);
        }

        prefs.edit()
                .putString("last_match", sb.toString())
                .putInt("morale", morale)
                .putInt("board", board)
                .putBoolean("acuna_out_next", false)
                .apply();
        showMatch();
    }

    private Player pickScorer(List<Player> startingPlayers) {
        List<Player> attackers = new ArrayList<>();
        for (Player p : startingPlayers) {
            if (p.pos.equals("DC") || p.pos.equals("EI") || p.pos.equals("ED") || p.pos.equals("MP")) attackers.add(p);
        }
        if (attackers.isEmpty()) attackers = startingPlayers;
        return attackers.get(random.nextInt(attackers.size()));
    }

    private LinearLayout body() {
        LinearLayout body = new LinearLayout(this);
        body.setOrientation(LinearLayout.VERTICAL);
        body.setPadding(dp(14), dp(4), dp(14), dp(22));
        return body;
    }

    private ScrollView scroll(View child) {
        ScrollView s = new ScrollView(this);
        s.setFillViewport(true);
        s.addView(child);
        return s;
    }

    private LinearLayout card() {
        LinearLayout c = new LinearLayout(this);
        c.setOrientation(LinearLayout.VERTICAL);
        c.setPadding(dp(16), dp(16), dp(16), dp(16));
        c.setBackground(makeBg(PANEL, 16, 1, Color.rgb(40, 66, 56)));
        return c;
    }

    private View metric(String name, int value) {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setPadding(dp(4), dp(6), dp(4), dp(6));
        TextView number = label(String.valueOf(value), 22, value >= 70 ? ACCENT : TEXT, true);
        number.setGravity(Gravity.CENTER);
        TextView nameText = label(name, 10, MUTED, false);
        nameText.setGravity(Gravity.CENTER);
        box.addView(number);
        box.addView(nameText);
        return box;
    }

    private LinearLayout.LayoutParams equal() {
        return new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
    }

    private Spinner spinner(String[] items, String selected) {
        Spinner spinner = new Spinner(this);
        ArrayAdapter<String> adapter = new ArrayAdapter<String>(this, android.R.layout.simple_spinner_dropdown_item, items) {
            @Override
            public View getView(int position, View convertView, ViewGroup parent) {
                View v = super.getView(position, convertView, parent);
                if (v instanceof TextView) {
                    ((TextView) v).setTextColor(TEXT);
                    ((TextView) v).setTextSize(14);
                    v.setPadding(dp(10), dp(8), dp(10), dp(8));
                }
                return v;
            }
        };
        spinner.setAdapter(adapter);
        int index = Arrays.asList(items).indexOf(selected);
        if (index >= 0) spinner.setSelection(index);
        spinner.setBackgroundTintList(ColorStateList.valueOf(ACCENT));
        return spinner;
    }

    private Button actionButton(String text, boolean primary) {
        Button b = new Button(this);
        b.setText(text);
        b.setTextSize(13);
        b.setTextColor(primary ? Color.rgb(5, 25, 15) : TEXT);
        b.setTypeface(Typeface.DEFAULT, Typeface.BOLD);
        b.setAllCaps(false);
        b.setMinHeight(dp(48));
        b.setBackground(makeBg(primary ? ACCENT : PANEL_2, 12, primary ? 0 : 1, primary ? 0 : Color.rgb(55, 88, 75)));
        return b;
    }

    private Button miniButton(String text, boolean active) {
        Button b = new Button(this);
        b.setText(text);
        b.setTextSize(11);
        b.setTextColor(active ? Color.rgb(4, 25, 14) : TEXT);
        b.setAllCaps(false);
        b.setBackground(makeBg(active ? ACCENT : PANEL_2, 10, 1, active ? ACCENT_DARK : Color.rgb(58, 84, 74)));
        return b;
    }

    private TextView label(String text, int sp, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(text);
        t.setTextSize(sp);
        t.setTextColor(color);
        t.setTypeface(Typeface.DEFAULT, bold ? Typeface.BOLD : Typeface.NORMAL);
        t.setLineSpacing(0f, 1.12f);
        return t;
    }

    private GradientDrawable makeBg(int color, int radiusDp, int strokeDp, int strokeColor) {
        GradientDrawable g = new GradientDrawable();
        g.setColor(color);
        g.setCornerRadius(dp(radiusDp));
        if (strokeDp > 0) g.setStroke(dp(strokeDp), strokeColor);
        return g;
    }

    private void setPage(View view) {
        content.removeAllViews();
        content.addView(view, new FrameLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
    }

    private void addGap(LinearLayout parent, int dp) {
        View v = new View(this);
        parent.addView(v, new LinearLayout.LayoutParams(1, dp(dp)));
    }

    private int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    private int clamp(int value) {
        return Math.max(0, Math.min(100, value));
    }

    private int clampRange(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private String firstLine(String text) {
        int n = text.indexOf('\n');
        return n >= 0 ? text.substring(0, n) : text;
    }

    private static class Player {
        final String name;
        final String pos;
        final int ovr;

        Player(String name, String pos, int ovr) {
            this.name = name;
            this.pos = pos;
            this.ovr = ovr;
        }
    }
}
