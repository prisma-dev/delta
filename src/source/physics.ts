import Object from "@rbxts/object-utils";
import { PhysicsObject } from "./physics-object";

export interface PhysicsObjectState {
	position: Vector3;
	velocity: Vector3;
	acceleration: Vector3;
}

export interface PhysicsSnapshot {
	timestamp: number;
	objects: Record<string, PhysicsObjectState>;
}

export const SCALE = 1000;

export class PhysicsEngine {
	private objects = new Map<string, PhysicsObject>();
	private globalForces = new Map<string, Vector3>();
	public currentTime = 0;
	private accumulatedTime = 0;
	private running = false;
	public timeScale = 1;
	private readonly fixedDeltaTime = 1 / 60;

	constructor() {}

	public Start(): void {
		this.running = true;
	}

	public Stop(): void {
		this.running = false;
	}

	public Step(realDeltaTime: number): void {
		if (!this.running) {
            return
        };

		const dt = realDeltaTime * this.timeScale;
		this.accumulatedTime += dt;

		while (this.accumulatedTime >= this.fixedDeltaTime) {
			this.currentTime += this.fixedDeltaTime;
			this.ApplyGlobalForces();
			this.UpdateObjects(this.fixedDeltaTime);
			this.DetectAndResolveCollisions(this.fixedDeltaTime);
			this.accumulatedTime -= this.fixedDeltaTime;
		}
	}

	public SetTime(targetTime: number): void {
        while (this.currentTime < targetTime) {
            this.Step(this.fixedDeltaTime);
        }
    }
    
	private UpdateObjects(dt: number): void {
		for (const [, obj] of this.objects) {
			obj.Update(dt);
		}
	}

	public AddGlobalForce(name: string, accel: Vector3): void {
		this.globalForces.set(name, accel);
	}

	private ApplyGlobalForces(): void {
		for (const [, obj] of this.objects) {
			if (obj.ignoreGlobalForces) continue;
			for (const [, accel] of this.globalForces) {
				obj.ApplyForce(accel);
			}
		}
	}

	public AddObject(id: string, object: PhysicsObject): void {
		this.objects.set(id, object);
	}

	public DestroyObject(id: string): void {
		this.objects.get(id)?.Destroy();
		this.objects.delete(id);
	}

	public GetObject(id: string): PhysicsObject | undefined {
		return this.objects.get(id);
	}

	public GetObjects(): PhysicsObject[] {
		return Object.values(this.objects);
	}

	private DetectAndResolveCollisions(dt: number): void {
		const objs = Object.values(this.objects);
		for (let i = 0; i < objs.size(); i++) {
			for (let j = i + 1; j < objs.size(); j++) {
				const objA = objs[i];
				const objB = objs[j];
				if (objA.collisionMethod === "none" || objB.collisionMethod === "none") continue;
				if (this.CheckCollision(objA, objB)) {
					this.ResolveCollision(objA, objB, dt);
				}
			}
		}
	}

	private CheckCollision(objA: PhysicsObject, objB: PhysicsObject): boolean {
		const posA = objA.GetWorldPosition();
		const posB = objB.GetWorldPosition();
        
		if (objA.collisionMethod === "point" && objB.collisionMethod === "point") {
			const threshold = 0.5;
			return posA.sub(posB).Magnitude < threshold;
		}

		if (objA.collisionMethod === "box" && objB.collisionMethod === "box") {
			if (!objA.size || !objB.size) return false;
			const diff = posA.sub(posB);
			return math.abs(diff.X) < (objA.size.X + objB.size.X) / 2 &&
				   math.abs(diff.Y) < (objA.size.Y + objB.size.Y) / 2 &&
				   math.abs(diff.Z) < (objA.size.Z + objB.size.Z) / 2;
		}

		if (objA.collisionMethod === "point" && objB.collisionMethod === "box") {
			if (!objB.size) return false;
			const diff = posA.sub(posB);
			return math.abs(diff.X) < (objB.size.X / 2) &&
				   math.abs(diff.Y) < (objB.size.Y / 2) &&
				   math.abs(diff.Z) < (objB.size.Z / 2);
		}

		if (objA.collisionMethod === "box" && objB.collisionMethod === "point") {
			if (!objA.size) return false;
			const diff = posB.sub(posA);
			return math.abs(diff.X) < (objA.size.X / 2) &&
				   math.abs(diff.Y) < (objA.size.Y / 2) &&
				   math.abs(diff.Z) < (objA.size.Z / 2);
		}

		return false;
	}

	private ResolveStaticCollisionCCD(dynamicObj: PhysicsObject, staticObj: PhysicsObject, dt: number): void {
        const staticUp = staticObj.rotation.VectorToWorldSpace(new Vector3(0, 1, 0));
        const halfHeight = staticObj.size ? staticObj.size.Y / 2 : 0.5;
        const groundTop = staticObj.GetWorldPosition().Dot(staticUp) + halfHeight;
        const p = dynamicObj.GetWorldPosition();
        const pProj = p.Dot(staticUp);
        const v = dynamicObj.velocity;
        const vNorm = v.Dot(staticUp);
        const groundFriction = 0.5;

        if (vNorm < 0) {
            const p_next = p.add(v.mul(dt));
            const pProjNext = p_next.Dot(staticUp);
            if (pProj >= groundTop && pProjNext < groundTop) {
                const t_collide = (pProj - groundTop) / (pProj - pProjNext);
                const collisionPos = p.add(v.mul(dt * t_collide));
                const restitution = dynamicObj.elasticity;
                const new_vNorm = -vNorm * restitution;
                const dt_remain = dt * (1 - t_collide);
                const vTan = v.sub(staticUp.mul(vNorm));
                const finalPos = collisionPos.add(vTan.mul(dt_remain)).add(staticUp.mul(new_vNorm * dt_remain));

                dynamicObj.position = finalPos;
                dynamicObj.velocity = vTan.add(staticUp.mul(new_vNorm));

                const new_vTan = vTan.mul(math.clamp(1 - groundFriction * dt, 0, 1));
                dynamicObj.velocity = new_vTan.add(staticUp.mul(new_vNorm));
            
                return;
            }
        }
        if (pProj < groundTop) {
            const penetration = groundTop - pProj;
            dynamicObj.position = dynamicObj.position.add(staticUp.mul(penetration));

            if (vNorm < 0) {
                const restitution = dynamicObj.elasticity;
                const new_vNorm = -vNorm * restitution;
                const vTan = v.sub(staticUp.mul(vNorm));
                dynamicObj.velocity = vTan.add(staticUp.mul(new_vNorm));

                const new_vTan = vTan.mul(math.clamp(1 - groundFriction * dt, 0, 1));
                dynamicObj.velocity = new_vTan.add(staticUp.mul(new_vNorm));
            }
        }
    }

	private ResolveDynamicCollision(objA: PhysicsObject, objB: PhysicsObject): void {
		const posA = objA.GetWorldPosition();
		const posB = objB.GetWorldPosition();

		const normal = posB.sub(posA).Unit;
		const relativeVelocity = objB.velocity.sub(objA.velocity);
		const velAlongNormal = relativeVelocity.Dot(normal);

		if (velAlongNormal > 0) {
            return
        };

		const restitution = (objA.elasticity + objB.elasticity) / 2;
		const impulseScalar = -(1 + restitution) * velAlongNormal / (1 / objA.mass + 1 / objB.mass);
		const impulse = normal.mul(impulseScalar);

		objA.velocity = objA.velocity.sub(impulse.div(objA.mass));
		objB.velocity = objB.velocity.add(impulse.div(objB.mass));

		const tangent = relativeVelocity.sub(normal.mul(velAlongNormal));

		if (tangent.Magnitude > 0) {
			const tangentUnit = tangent.Unit;
			const frictionCoefficient = (objA.friction + objB.friction) / 2;
			const jt = -relativeVelocity.Dot(tangentUnit) / (1 / objA.mass + 1 / objB.mass);
			const frictionImpulseScalar = math.abs(jt) < impulseScalar * frictionCoefficient ? jt : -impulseScalar * frictionCoefficient;
			const frictionImpulse = tangentUnit.mul(frictionImpulseScalar);

			objA.velocity = objA.velocity.sub(frictionImpulse.div(objA.mass));
			objB.velocity = objB.velocity.add(frictionImpulse.div(objB.mass));
		}

		const newRel = objB.velocity.sub(objA.velocity);
		const newTangent = newRel.sub(normal.mul(newRel.Dot(normal)));

		if (newTangent.Magnitude < 0.01) {
			const normA = objA.velocity.Dot(normal);
			const normB = objB.velocity.Dot(normal);
			objA.velocity = normal.mul(normA);
			objB.velocity = normal.mul(normB);
		}
	}

	private ResolveCollision(objA: PhysicsObject, objB: PhysicsObject, dt: number): void {
		if (objA.ignoreGlobalForces !== objB.ignoreGlobalForces) {
			if (objA.ignoreGlobalForces) {
				this.ResolveStaticCollisionCCD(objB, objA, dt);
			} else {
				this.ResolveStaticCollisionCCD(objA, objB, dt);
			}
			return;
		}
		if (this.CheckCollision(objA, objB)) {
			this.ResolveDynamicCollision(objA, objB);
		}
	}

	public GetSnapshot(): PhysicsSnapshot {
		const snapshot: PhysicsSnapshot = {
			timestamp: this.currentTime,
			objects: {},
		};
		this.objects.forEach((obj, id) => {
			snapshot.objects[id] = obj.GetState();
		});
		return snapshot;
	}

	public ApplySnapshot(snapshot: PhysicsSnapshot): void {
		this.currentTime = snapshot.timestamp;
		for (const [id, state] of Object.entries(snapshot.objects)) {
			const obj = this.objects.get(id);
			if (obj) {
				obj.RestoreState(state);
			}
		}
	}

	public Destroy(): void {
		this.Stop();
		this.ClearObjects();
	}

	public ClearObjects(): void {
		this.objects.forEach((obj) => obj.Destroy());
		this.objects.clear();
	}
}
