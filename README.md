# Delta

A deterministic physics simulation library for Roblox written in TypeScript.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
    - [TypeScript](#typescript)
    - [Luau](#luau)
- [API Documentation](#api-documentation)
    - [PhysicsObject](#physicsobject)
    - [PhysicsEngine](#physicsengine)
- [Examples](#examples)
- [Notes](#notes)
- [License](#license)

## Overview

The library provides a modular, deterministic physics simulation system for Roblox. The library operates entirely in world units (meters, m/s, m/s²) and features:

- **Translation and Rotation:** Euler integration for position, velocity, and rotation.
- **Collision Detection:** Supports both simple AABB (for point and box collisions) and oriented bounding box (OBB) collision detection for static, rotated objects.
- **Collision Resolution:** Impulse-based resolution with restitution and friction impulses.
- **Friction & Damping:** Applies friction and damping on dynamic objects when in contact with static objects.
- **Customizable Time Control:** Fixed time step integration with a SetTime method for fast-forwarding the simulation.

## Features

- **World-Unit Integration:** All positions, velocities, and forces are expressed in world units.
- **Oriented Static Collision:** Supports collisions with rotated static platforms via OBB calculations (no physical part is required).
- **Dynamic Collision Resolution:** Uses impulse-based resolution with friction between dynamic objects.
- **Rotational Dynamics:** Updates rotation, angular velocity, and angular acceleration.
- **Time Control:** A fixed time-step integrator and a SetTime method that advances simulation until the target time is reached.

## Installation

### TypeScript

1. In the terminal run: `npm i @rbxts/delta`

### Luau

1. For luau you must use the [pesde](https://pesde.dev/) package manager
2. To add the package run: `pesde add prismatyx/delta`
3. to install the package run `pesde install`

## Usage

### TypeScript

```typescript
import { PhysicsEngine, PhysicsObject } from "@rbxts/delta";

// Create engine and start it.
const engine = new PhysicsEngine();
engine.Start();

// Create a ball.
const ball = new PhysicsObject(
	"ball",
	{
		mass: 10,
		friction: 0.5,
		elasticity: 0.8,
		collisionMethod: "box",
		size: new Vector3(2, 2, 2),
		ignoreGlobalForces: false,
	},
	{
		position: new Vector3(0, 10, 0),
		velocity: new Vector3(0, 0, 0),
		acceleration: new Vector3(0, 0, 0),
		forces: [],
	},
);

// Create a static platform.
const platform = new PhysicsObject(
	"platform",
	{
		mass: 1e9,
		friction: 0.4,
		elasticity: 0.4,
		collisionMethod: "box",
		size: new Vector3(20, 2, 20),
		ignoreGlobalForces: true,
	},
	{
		position: new Vector3(0, 0, 0),
		velocity: new Vector3(0, 0, 0),
		acceleration: new Vector3(0, 0, 0),
		forces: [],
	},
);

// Add objects to the engine.
engine.AddObject("ball", ball);
engine.AddObject("platform", platform);

// Add gravity.
engine.AddGlobalForce("gravity", new Vector3(0, -9.81, 0));

// Simulate.
game.GetService("RunService").Stepped.Connect((_, dt) => {
	engine.Step(dt);
});
```

### Luau

```lua
local delta = require(game.ReplicatedStorage.delta)
local PhysicsEngine = delta.PhysicsEngine
local PhysicsObject = delta.PhysicsObject

local engine = PhysicsEngine.new()
engine:Start()

local ball = PhysicsObject.new("ball", {
	mass = 10,
	friction = 0.5,
	elasticity = 0.8,
	collisionMethod = "box",
	size = Vector3.new(2, 2, 2),
	ignoreGlobalForces = false,
}, {
	position = Vector3.new(0, 10, 0),
	velocity = Vector3.new(0, 0, 0),
	acceleration = Vector3.new(0, 0, 0),
	forces = {}
})

local platform = PhysicsObject.new("platform", {
	mass = 1e9,
	friction = 0.4,
	elasticity = 0.4,
	collisionMethod = "box",
	size = Vector3.new(20, 2, 20),
	ignoreGlobalForces = true,
}, {
	position = Vector3.new(0, 0, 0),
	velocity = Vector3.new(0, 0, 0),
	acceleration = Vector3.new(0, 0, 0),
	forces = {}
})

engine:AddObject("ball", ball)
engine:AddObject("platform", platform)
engine:AddGlobalForce("gravity", Vector3.new(0, -9.81, 0))

game:GetService("RunService").Stepped:Connect(function(_, dt)
	engine:Step(dt)
end)
```

## API Documentation

### PhysicsObject

- **Constructor:**  
  `new(id: string, properties: PhysicsObjectProperties, state?: ObjectState, part?: BasePart)`  
  Creates a new physics object.  
  _Properties:_

    - `mass`: Mass of the object.
    - `friction`: Friction coefficient (default 0.3).
    - `damping`: Additional damping for contact with static objects (default 0.5).
    - `elasticity`: Restitution coefficient (default 0.4).
    - `momentOfInertia`: Rotational inertia (default 1).
    - `collisionMethod`: "box", "point", or "none".
    - `size`: For box collisions, the dimensions of the hitbox.
    - `ignoreGlobalForces`: If true, the object will not receive global forces (e.g. static objects).

- **ApplyForce(force: Vector3, offset?: Vector3): void**  
  Applies a force (and optional offset for torque) to the object.

- **Update(dt: number): void**  
  Updates the object state (position, velocity, rotation) over a time step.

- **GetWorldPosition(): Vector3**  
  Returns the current world position.

- **GetState(): PhysicsObjectState**  
  Returns the current state (position, velocity, acceleration).

- **Destroy(): void**  
  Cleans up the object.

### PhysicsEngine

- **Constructor:**  
  `new()`  
  Creates a new physics engine instance.

- **Start(): void**  
  Starts the simulation.

- **Stop(): void**  
  Stops the simulation.

- **Step(realDeltaTime: number): void**  
  Advances the simulation by the given delta time (adjusted by timeScale).

- **SetTime(targetTime: number): void**  
  Advances the simulation until the current time reaches the target time.

- **AddGlobalForce(name: string, accel: Vector3): void**  
  Adds a global force (provided as acceleration) to all dynamic objects.

- **AddObject(id: string, object: PhysicsObject): void**  
  Adds a physics object to the simulation.

- **DestroyObject(id: string): void**  
  Removes and destroys the object with the given id.

- **GetObject(id: string): PhysicsObject | undefined**  
  Retrieves an object by its id.

- **GetObjects(): PhysicsObject[]**  
  Returns all physics objects.

## Notes

- **Rotational Collisions:**  
  The library currently updates rotation via applied torques but doesn't automatically compute collision based torques. This will be added sometime in the future

- **Performance:**  
  Point collision detection is simpler and is more performant than box collision. However, the performance difference is generally negligible unless you have a very large number of objects

- **Customization:**  
  Adjust parameters (mass, friction, damping, elasticity, fixedDeltaTime) to tune the simulation behavior to your needs

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
