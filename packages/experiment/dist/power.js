export function impressionsForDelta(baseline, delta, z = 1.96, power = 0.84) {
    const p1 = baseline;
    const p2 = baseline + delta;
    const pBar = (p1 + p2) / 2;
    const numerator = Math.pow(z * Math.sqrt(2 * pBar * (1 - pBar)) + power * Math.sqrt(p1 * (1 - p1) + p2 * (1 - p2)), 2);
    const denominator = Math.pow(p2 - p1, 2);
    if (!isFinite(denominator) || denominator === 0)
        return Infinity;
    return Math.ceil(numerator / denominator);
}
//# sourceMappingURL=power.js.map