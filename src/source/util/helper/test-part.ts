import { Janitor } from "@rbxts/janitor"
import { Workspace } from "@rbxts/services"

export default function createTestPart(janitor?: Janitor): Part {
    const testPart = new Instance("Part", Workspace)
    testPart.Shape = Enum.PartType.Ball
    testPart.Size = new Vector3(2, 2, 2)
    testPart.Anchored = true
    testPart.CanCollide = false
    testPart.Color = new Color3(math.random(), math.random(), math.random())

    if (janitor !== undefined){
        janitor.Add(testPart, "Destroy")
    }

    return testPart
}