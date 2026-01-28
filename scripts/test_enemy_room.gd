extends Node2D

const ENEMY_SCENE := preload("res://scenes/Enemy.tscn")

@onready var enemies_container: Node2D = $Enemies

func _ready() -> void:
	_spawn_enemy(Vector2(-200, 0))
	_spawn_enemy(Vector2(200, 0))

func _spawn_enemy(position: Vector2) -> void:
	var enemy := ENEMY_SCENE.instantiate()
	enemy.global_position = position
	enemies_container.add_child(enemy)
