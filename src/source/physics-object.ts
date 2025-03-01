import { PhysicsObjectState } from "./physics";

export interface ObjectState extends PhysicsObjectState {
	forces: Vector3[];
}

export interface PhysicsObjectProperties {
	mass: number;
	friction?: number;
	elasticity?: number;
	momentOfInertia?: number;
	collisionMethod?: "box" | "point" | "none";
	size?: Vector3;
	ignoreGlobalForces?: boolean;
}

export class PhysicsObject {
	public id: string;
	public mass: number;
	public friction: number;
	public elasticity: number;
	public momentOfInertia: number;
	public position: Vector3 = Vector3.zero;
	public prevPosition: Vector3 = Vector3.zero;
	public velocity: Vector3 = Vector3.zero;
	public acceleration: Vector3 = Vector3.zero;
	public rotation: CFrame = new CFrame();
	public angularVelocity: Vector3 = Vector3.zero;
	public angularAcceleration: Vector3 = Vector3.zero;
	public collisionMethod: "box" | "point" | "none";
	public size?: Vector3;
	public ignoreGlobalForces: boolean;
	private forces: Vector3[] = [];
	private torques: Vector3[] = [];
	private part?: BasePart;
    private hitbox?: Part;

	constructor(id: string, properties: PhysicsObjectProperties, state?: ObjectState, part?: BasePart) {
		this.id = id;
		this.mass = properties.mass;
		this.friction = properties.friction ?? 0.3;
		this.elasticity = properties.elasticity ?? 0.4;
		this.momentOfInertia = properties.momentOfInertia ?? 1;
		this.ignoreGlobalForces = properties.ignoreGlobalForces ?? false;
		this.collisionMethod = properties.collisionMethod ?? "point";

		if (this.collisionMethod === "box") {
			if (!properties.size) error("Box collision requires a size.");
			this.size = properties.size;
		}

		this.part = part;

		if (state !== undefined) {
			this.ApplyState(state);
		} else {
			this.position = new Vector3(0, 0, 0);
			this.prevPosition = this.position;
			this.velocity = new Vector3(0, 0, 0);
			this.acceleration = new Vector3(0, 0, 0);
		}
	}

	public ApplyState(state: ObjectState): void {
		this.position = state.position;
		this.prevPosition = this.position;
		this.velocity = state.velocity;
		this.acceleration = state.acceleration;
		this.forces = state.forces;
	}

    public ShowHitbox(show: boolean): void {
        this.hitbox?.Destroy()

        if (show === false){
            return
        }

        if (this.size === undefined){
            
        }
    }

	public RestoreState(state: PhysicsObjectState): void {
		this.position = state.position;
		this.prevPosition = this.position;
		this.velocity = state.velocity;
		this.acceleration = state.acceleration;
	}

	public ApplyForce(force: Vector3, offset?: Vector3): void {
        this.forces.push(force)
		if (offset) {
			const torque = offset.Cross(force);
            this.torques.push(torque)
		}
	}

	public ClearForces(): void {
		this.forces = [];
	}

	public ClearTorques(): void {
		this.torques = [];
	}

	public GetWorldPosition(): Vector3 {
		return this.position;
	}

	public GetSmoothedWorldPosition(alpha: number): Vector3 {
		return this.prevPosition.Lerp(this.position, alpha);
	}

	public Update(dt: number): void {
		this.prevPosition = this.position;
		let totalAccel = new Vector3(0, 0, 0);
        
		for (const f of this.forces) {
			totalAccel = totalAccel.add(f);
		}

		this.ClearForces();
		this.acceleration = totalAccel;
		this.velocity = this.velocity.add(this.acceleration.mul(dt));

		this.position = this.position.add(this.velocity.mul(dt));
		let totalTorque = new Vector3(0, 0, 0);

		for (const t of this.torques) {
			totalTorque = totalTorque.add(t);
		}

		this.ClearTorques();
		this.angularAcceleration = totalTorque.div(this.momentOfInertia);
		this.angularVelocity = this.angularVelocity.add(this.angularAcceleration.mul(dt));
		const rotInc = CFrame.fromEulerAnglesXYZ(this.angularVelocity.X * dt, this.angularVelocity.Y * dt, this.angularVelocity.Z * dt);
		this.rotation = this.rotation.mul(rotInc);
		if (this.part) {
			this.part.CFrame = this.rotation.add(this.GetWorldPosition());
		}
	}

	public GetState(): PhysicsObjectState {
		return {
			position: this.position,
			velocity: this.velocity,
			acceleration: this.acceleration,
		};
	}

	public Destroy(): void {
		if (this.part) {
			this.part.Destroy();
		}
	}
}
