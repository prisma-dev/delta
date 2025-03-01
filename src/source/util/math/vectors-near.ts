export default function vectorsNear(v1: Vector3, v2: Vector3, tolerance: number): boolean {
	return math.abs(v1.X - v2.X) < tolerance &&
		math.abs(v1.Y - v2.Y) < tolerance &&
		math.abs(v1.Z - v2.Z) < tolerance
}