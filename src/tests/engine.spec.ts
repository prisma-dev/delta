/// <reference types="@rbxts/testez/globals" />

import { Workspace } from "@rbxts/services"
import { Janitor } from "@rbxts/janitor"
import createTestPart from "../source/util/helper/test-part"
import { PhysicsEngine, PhysicsObject } from "../exports"
import vectorsNear from "../source/util/math/vectors-near"
import rotationsNear from "../source/util/math/rotations-near"

export = () => {
    const janitor = new Janitor()
    let testEngine: PhysicsEngine
    const objectName = "test"

    beforeEach(() => {
        testEngine = new PhysicsEngine()
    })

    describe("Engine Setup", () => {
        it("should start the engine without errors", () => {
            testEngine.Start()
            expect(true).to.equal(true)
        })

        it("should stop the engine without errors", () => {
            testEngine.Stop()
            expect(true).to.equal(true)
        })
    })

    describe("Object Manipulation", () => {
        let testObject: PhysicsObject
        let testPart: BasePart

        beforeEach(() => {
            testPart = createTestPart(janitor)
            testObject = new PhysicsObject(objectName, { mass: 10 }, undefined, testPart)
        })

        it("should add an object to the engine", () => {
            testEngine.AddObject(objectName, testObject)
            expect(testEngine.GetObject(objectName)).to.equal(testObject)
        })
        
        it("should get the correct object", () => {
            testEngine.AddObject(objectName, testObject)
            const retrieved = testEngine.GetObject(objectName)
            expect(retrieved).to.equal(testObject)
        })

        it("should clear objects from the engine", () => {
            testEngine.AddObject(objectName, testObject)
            testEngine.ClearObjects()
            expect(testEngine.GetObject(objectName)).to.equal(undefined)
        })
    })

    describe("Simulation Step", () => {
        let testObject: PhysicsObject
        let testPart: BasePart

        beforeEach(() => {
            testPart = createTestPart(janitor)
            testObject = new PhysicsObject(objectName, { mass: 10 }, undefined, testPart)
            testEngine.AddObject(objectName, testObject)

            testObject.ApplyState({
                position: new Vector3(0, 10, 0),
                velocity: new Vector3(0, 0, 0),
                acceleration: new Vector3(0, 0, 0),
                forces: []
            })
        })

        it("should update object position when stepped", () => {
            testObject.ApplyForce(new Vector3(0, -9.81, 0))
            testEngine.Start()
            testEngine.Step(1/60)

            const newPos = testObject.GetWorldPosition()
            expect(newPos.Y < 10).to.equal(true)
        })

        it("should produce deterministic results over multiple steps", () => {
            testObject.ApplyForce(new Vector3(0, -9.81, 0))
            testEngine.Start()
            for (let i = 0; i < 10; i++) {
                testEngine.Step(1/60)
            }
            const pos1 = testObject.GetWorldPosition()

            testEngine.ClearObjects()
            const testPart2 = createTestPart(janitor)
            testObject = new PhysicsObject(objectName, { mass: 10 }, undefined, testPart2)
            testEngine.AddObject(objectName, testObject)
            testObject.ApplyState({
                position: new Vector3(0, 10, 0),
                velocity: new Vector3(0, 0, 0),
                acceleration: new Vector3(0, 0, 0),
                forces: []
            })
            testObject.ApplyForce(new Vector3(0, -9.81, 0))
            for (let i = 0; i < 10; i++) {
                testEngine.Step(1/60)
            }
            const pos2 = testObject.GetWorldPosition()

            expect(vectorsNear(pos1, pos2, 0.001)).to.equal(true)
        })
    })

    describe("Rotational Forces", () => {
		let testObject: PhysicsObject;
		let testPart: BasePart;

		beforeEach(() => {
			testPart = createTestPart(janitor);
			testObject = new PhysicsObject(objectName, { mass: 10, momentOfInertia: 2 }, undefined, testPart);
			testEngine.AddObject(objectName, testObject);

			testObject.ApplyState({
				position: new Vector3(0, 10, 0),
				velocity: new Vector3(0, 0, 0),
				acceleration: new Vector3(0, 0, 0),
				forces: []
			});
		});

		it("should update angular velocity and rotation when a force with an offset is applied", () => {
			const initialRotation = testObject.rotation;
			const initialAngularVelocity = testObject.angularVelocity;

			testObject.ApplyForce(new Vector3(0, -9.81, 0), new Vector3(1, 0, 0));
			testEngine.Start();
			testEngine.Step(1/60);

			const newAngularVelocity = testObject.angularVelocity;
			const newRotation = testObject.rotation;

			expect(newAngularVelocity.Magnitude > 0).to.equal(true);

			const [ix, iy, iz] = initialRotation.ToEulerAnglesXYZ();
			const [nx, ny, nz] = newRotation.ToEulerAnglesXYZ();
			expect((math.abs(nx - ix) > 0) || (math.abs(ny - iy) > 0) || (math.abs(nz - iz) > 0)).to.equal(true);
		});
	});

    describe("Collision Simulation: Bouncing Balls on Ground", () => {
		let ground: PhysicsObject;
		let ball1: PhysicsObject;
		let ball2: PhysicsObject;
		let groundPart: BasePart;
		let ball1Part: BasePart;
		let ball2Part: BasePart;
		
		beforeEach(() => {
			groundPart = createTestPart(janitor);
			groundPart.Position = new Vector3(0, 0, 0);
			ground = new PhysicsObject("ground", {
				mass: 1e9,
				collisionMethod: "box",
				size: new Vector3(100, 1, 100),
				ignoreGlobalForces: true,
			}, {
				position: new Vector3(0, 0.5, 0),
				velocity: new Vector3(0, 0, 0),
				acceleration: new Vector3(0, 0, 0),
				forces: []
			}, groundPart);
			
			ball1Part = createTestPart(janitor);
			ball2Part = createTestPart(janitor);
			ball1 = new PhysicsObject("ball1", {
				mass: 10,
				collisionMethod: "box",
                size: new Vector3(1, 1, 1),
				ignoreGlobalForces: false,
				elasticity: 0.4,
			}, {
				position: new Vector3(0, 19, 0),
				velocity: new Vector3(0, 0, 0),
				acceleration: new Vector3(0, 0, 0),
				forces: []
			}, ball1Part);
			ball2 = new PhysicsObject("ball2", {
				mass: 10,
				collisionMethod: "point",
				ignoreGlobalForces: false,
				elasticity: 0.4,
			}, {
				position: new Vector3(5, 19, 0),
				velocity: new Vector3(0, 0, 0),
				acceleration: new Vector3(0, 0, 0),
				forces: []
			}, ball2Part);
			
			testEngine.AddObject("ground", ground);
			testEngine.AddObject("ball1", ball1);
			testEngine.AddObject("ball2", ball2);
			
			testEngine.AddGlobalForce("gravity", new Vector3(0, -9.81, 0));
			
			testEngine.Start();
		});
		
		it("should simulate box collision", () => {
			let ball1Bounced = false;

            for (let i = 0; i < 300; i++) {
				testEngine.Step(1/60);
                if (i > 60 && ball1.velocity.Y > 0) {
					ball1Bounced = true;
				}
			}
			
			expect(ball1Bounced).to.equal(true);
            expect(ball1.GetWorldPosition().Y >= 1).to.equal(true);
			
			expect(vectorsNear(ground.GetWorldPosition(), new Vector3(0, 0.5, 0), 0.001)).to.equal(true);
		});

        it("should simulate point collision", () => {
			let ball2Bounced = false;

            for (let i = 0; i < 300; i++) {
				testEngine.Step(1/60);

                if (i > 60 && ball2.velocity.Y > 0) {
					ball2Bounced = true;
				}
			}
			
			expect(ball2Bounced).to.equal(true);
			
			expect(ball2.GetWorldPosition().Y >= 1).to.equal(true);
			
			expect(vectorsNear(ground.GetWorldPosition(), new Vector3(0, 0.5, 0), 0.001)).to.equal(true);
		});
	});
	
	describe("Non-Collidable Objects and Ignoring Global Forces", () => {
		let nonCollidable: PhysicsObject;
		let testPart: BasePart;
		
		beforeEach(() => {
			testPart = createTestPart(janitor);
			nonCollidable = new PhysicsObject("nonCollidable", {
				mass: 5,
				collisionMethod: "none",
				ignoreGlobalForces: true,
			}, {
				position: new Vector3(10, 10, 0),
				velocity: new Vector3(0, 0, 0),
				acceleration: new Vector3(0, 0, 0),
				forces: []
			}, testPart);
			
			testEngine.AddObject("nonCollidable", nonCollidable);
			testEngine.AddGlobalForce("gravity", new Vector3(0, -9.81, 0));
			testEngine.Start();
		});
		
		it("should not apply collisions to non-collidable objects", () => {
			for (let i = 0; i < 60; i++) {
				testEngine.Step(1/60);
			}
			expect(nonCollidable.velocity.Magnitude).to.equal(0);
		});
		
		it("should ignore global forces for objects marked to ignore them", () => {
			for (let i = 0; i < 60; i++) {
				testEngine.Step(1/60);
			}
			expect(vectorsNear(nonCollidable.GetWorldPosition(), new Vector3(10, 10, 0), 0.001)).to.equal(true);
		});
	});

	describe("Part Rotation & Positioning", () => {
		let testObject: PhysicsObject;
		let testPart: BasePart;

		beforeEach(() => {
			testPart = createTestPart(janitor);
			testObject = new PhysicsObject(objectName, { mass: 10, momentOfInertia: 2 }, undefined, testPart);
			testEngine.AddObject(objectName, testObject);

			testObject.ApplyState({
				position: new Vector3(0, 10, 0),
				velocity: new Vector3(0, 0, 0),
				acceleration: new Vector3(0, 0, 0),
				forces: []
			});
		});

		it("should update the attached part's CFrame with rotation and position", () => {
			testObject.ApplyForce(new Vector3(0, -9.81, 0), new Vector3(1, 0, 0));
			testEngine.Start();
			testEngine.Step(1/60);

			const expectedCFrame = testObject.rotation.add(testObject.GetWorldPosition());
			const partCFrame = testPart.CFrame;

			const posDiff = (partCFrame.Position.sub(expectedCFrame.Position)).Magnitude;
			expect(posDiff < 0.001).to.equal(true);

			expect(rotationsNear(expectedCFrame, partCFrame, 0.001)).to.equal(true);
		});
	});

    describe("Deterministic Simulation", () => {
		it("should produce identical final position given same initial state and force", () => {
			const engine1 = new PhysicsEngine();
			const testObject1 = new PhysicsObject("detTest", {
				mass: 10,
				collisionMethod: "none"
			}, {
				position: new Vector3(0, 10, 0),
				velocity: new Vector3(0, 0, 0),
				acceleration: new Vector3(0, 0, 0),
				forces: []
			});
			engine1.AddObject("detTest", testObject1);
			engine1.AddGlobalForce("gravity", new Vector3(0, -9.81, 0));

            const appliedForce = new Vector3(5, 20, -3);
			testObject1.ApplyForce(appliedForce);
			engine1.Start();

            for (let i = 0; i < 300; i++) {
				engine1.Step(1/60);
			}
			const finalPos1 = testObject1.GetWorldPosition();

			const engine2 = new PhysicsEngine();
			const testObject2 = new PhysicsObject("detTest", {
				mass: 10,
				collisionMethod: "none"
			}, {
				position: new Vector3(0, 10, 0),
				velocity: new Vector3(0, 0, 0),
				acceleration: new Vector3(0, 0, 0),
				forces: []
			});
			engine2.AddObject("detTest", testObject2);
			engine2.AddGlobalForce("gravity", new Vector3(0, -9.81, 0));
			testObject2.ApplyForce(appliedForce);
			engine2.Start();
			for (let i = 0; i < 300; i++) {
				engine2.Step(1/60);
			}
			const finalPos2 = testObject2.GetWorldPosition();

			expect(vectorsNear(finalPos1, finalPos2, 0.001)).to.equal(true);
		});
	});

    describe("SetTime Method", () => {
		let testEngine: PhysicsEngine;
		let testObject: PhysicsObject;

		beforeEach(() => {
			testEngine = new PhysicsEngine();
			testObject = new PhysicsObject("test", { mass: 10, collisionMethod: "none" }, {
				position: new Vector3(0, 10, 0),
				velocity: new Vector3(0, 0, 0),
				acceleration: new Vector3(0, 0, 0),
				forces: []
			});
			testEngine.AddObject("test", testObject);
			testEngine.AddGlobalForce("gravity", new Vector3(0, -9.81, 0));
		});

		it("should update simulation state to the target time", () => {
			testEngine.Start();
			testEngine.Step(1); 
			const posBefore = testObject.GetWorldPosition();

			testEngine.SetTime(10);
			const posAfter = testObject.GetWorldPosition();
			const timeAfter = testEngine.currentTime;

			expect(math.round(timeAfter)).to.equal(10);
			expect(posAfter.Y < posBefore.Y).to.equal(true);
		});
	});

    describe("Global Forces", () => {
        let testObject: PhysicsObject;
        let testPart: BasePart;

        beforeEach(() => {
            testPart = createTestPart(janitor);
            testObject = new PhysicsObject(objectName, { mass: 10 }, undefined, testPart);
            testEngine.AddObject(objectName, testObject);

            testObject.ApplyState({
                position: new Vector3(0, 10, 0),
                velocity: new Vector3(0, 0, 0),
                acceleration: new Vector3(0, 0, 0),
                forces: []
            });
        });

        it("should apply global forces to all objects", () => {
            testEngine.AddGlobalForce("gravity", new Vector3(0, -9.81, 0));
            testEngine.Start();
            testEngine.Step(1/60);

            const state = testObject.GetState();
            expect(state.velocity.Y < 0).to.equal(true);

            const worldPos = testObject.GetWorldPosition();
            expect(worldPos.Y < 10).to.equal(true);
        });
    });

    describe("Snapshot and Restore", () => {
        let testObject: PhysicsObject
        let testPart: BasePart

        beforeEach(() => {
            testPart = createTestPart(janitor)
            testObject = new PhysicsObject(objectName, { mass: 10 }, undefined, testPart)
            testEngine.AddObject(objectName, testObject)

            testObject.ApplyState({
                position: new Vector3(0, 10, 0),
                velocity: new Vector3(0, 0, 0),
                acceleration: new Vector3(0, 0, 0),
                forces: []
            })
            testEngine.Start()
            testEngine.Step(1/60)
        })

        it("should create a snapshot and restore it", () => {
            const snapshot = testEngine.GetSnapshot()

            testObject.ApplyState({
                position: new Vector3(100, 100, 100),
                velocity: new Vector3(0, 0, 0),
                acceleration: new Vector3(0, 0, 0),
                forces: []
            })

            testEngine.ApplySnapshot(snapshot)
            const restoredState = testObject.GetState()
            const snapState = snapshot.objects[objectName]

            expect(vectorsNear(restoredState.position, snapState.position, 0.001)).to.equal(true)
            expect(vectorsNear(restoredState.velocity, snapState.velocity, 0.001)).to.equal(true)
            expect(vectorsNear(restoredState.acceleration, snapState.acceleration, 0.001)).to.equal(true)
        })
    })

    afterAll(() => janitor.Destroy())
}
