extends CharacterBody2D

@export var speed: float = 80.0
@export var max_hp: int = 3

var hp: int

func _ready() -> void:
	hp = max_hp
	add_to_group("enemies")

func _physics_process(delta: float) -> void:
	var player := _get_player()
	if player == null:
		velocity = Vector2.ZERO
		move_and_slide()
		return

	var direction := player.global_position - global_position
	if direction.length_squared() > 0.001:
		direction = direction.normalized()

	velocity = direction * speed
	move_and_slide()

func _get_player() -> Node2D:
	var players := get_tree().get_nodes_in_group("player")
	if players.is_empty():
		return null
	return players[0]

func take_damage(amount: int) -> void:
	hp -= amount
	if hp <= 0:
		queue_free()
