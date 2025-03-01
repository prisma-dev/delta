export default function rotationsNear(cf1: CFrame, cf2: CFrame, tolerance: number): boolean {
	const [ax, ay, az] = cf1.ToEulerAnglesXYZ();
	const [bx, by, bz] = cf2.ToEulerAnglesXYZ();
	return math.abs(ax - bx) < tolerance &&
		math.abs(ay - by) < tolerance &&
		math.abs(az - bz) < tolerance;
}