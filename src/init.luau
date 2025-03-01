export type PhysicsEngine = {
	Start: (self: PhysicsEngine) -> (),
	Stop: (self: PhysicsEngine) -> (),
	Step: (self: PhysicsEngine, realDeltaTime: number) -> (),
	SetTime: (self: PhysicsEngine, targetTime: number) -> (),
	AddGlobalForce: (self: PhysicsEngine, name: string, force: Vector3) -> (),
	AddObject: (self: PhysicsEngine, id: string, object: PhysicsObject) -> (),
	DestroyObject: (self: PhysicsEngine, id: string) -> (),
	ClearObjects: (self: PhysicsEngine) -> (),
	GetObject: (self: PhysicsEngine, id: string) -> PhysicsObject?,
	GetObjects: (self: PhysicsEngine) -> { [number]: PhysicsObject },
	GetSnapshot: (self: PhysicsEngine) -> {
		timestamp: number,
		objects: { [string]: { position: Vector3, velocity: Vector3, acceleration: Vector3 } }
	},
	ApplySnapshot: (self: PhysicsEngine, snapshot: {
		timestamp: number,
		objects: { [string]: { position: Vector3, velocity: Vector3, acceleration: Vector3 } }
	}) -> (),
	Destroy: (self: PhysicsEngine) -> (),

	currentTime: number,
}

export type PhysicsEngineConstructor = {
	new: () -> PhysicsEngine,
}

export type PhysicsObject = {
	ApplyState: (self: PhysicsObject, state: { position: Vector3, velocity: Vector3, acceleration: Vector3, forces: { Vector3 } }) -> (),
	RestoreState: (self: PhysicsObject, state: { position: Vector3, velocity: Vector3, acceleration: Vector3 }) -> (),
	ApplyForce: (self: PhysicsObject, force: Vector3, offset: Vector3?) -> (),
	ClearForces: (self: PhysicsObject) -> (),
	GetWorldPosition: (self: PhysicsObject) -> Vector3,
	Update: (self: PhysicsObject, deltaTime: number) -> (),
	GetState: (self: PhysicsObject) -> { position: Vector3, velocity: Vector3, acceleration: Vector3 },
	Destroy: (self: PhysicsObject) -> (),

	id: string,
	mass: number,
	friction: number,
	elasticity: number,
	momentOfInertia: number,
	position: Vector3,
	velocity: Vector3,
	acceleration: Vector3,
	rotation: CFrame,
	angularVelocity: Vector3,
	angularAcceleration: Vector3,
	collisionMethod: "box" | "point" | "none",
	size: Vector3?,
	ignoreGlobalForces: boolean,
	part: Instance?,
}

export type PhysicsObjectConstructor = {
	new: (
		id: string,
		properties: {
			mass: number,
			friction: number?,
			elasticity: number?,
			momentOfInertia: number?,
			collisionMethod: "box" | "point" | "none",
			size: Vector3?,
			ignoreGlobalForces: boolean?,
		},
		state: { position: Vector3, velocity: Vector3, acceleration: Vector3, forces: { Vector3 } }?,
		part: Instance?
	) -> PhysicsObject,
}

export type delta = {
	PhysicsEngine: PhysicsEngineConstructor,
	PhysicsObject: PhysicsObjectConstructor,
}

local TS = script:FindFirstChild("include")
	and require(script:WaitForChild("include"):WaitForChild("RuntimeLib"))
	or _G[script]

local exports = {}

for _k, _v in TS.import(script, script, "exports") or {} do
	exports[_k] = _v
end

table.freeze(exports)

return exports :: delta
