type TrajectoryCase = {
  id: string;
  problem: string;
  title: string;
  accuracy: string;
  delta: string;
  tone: "positive" | "caveat";
  strength: "Primary" | "Strong" | "Supporting";
  prefix: string;
  cleanToken: string;
  cleanProbability: string;
  editedToken: string;
  editedProbability: string;
  sampledToken: string;
  sampledShift: string;
  vanilla: string;
  vanillaFinal: string;
  amplified: string;
  amplifiedFinal: string;
  interpretation: string;
  caveat?: string;
};

const trajectoryCases: TrajectoryCase[] = [
  {
    id: "aime-2024-p12",
    problem: "AIME 2024 · Problem 12",
    title: "Convert hours before adding minutes",
    accuracy: "17.3% → 41.3%",
    delta: "+24.0 pp",
    tone: "positive",
    strength: "Primary",
    prefix: "… the time taken at s + 1/2 km/h is 9/3 = 3 hours.",
    cleanToken: "↵ newline",
    cleanProbability: "0.93",
    editedToken: "Since",
    editedProbability: "0.41",
    sampledToken: "Since",
    sampledShift: "0.03 → 0.41",
    vanilla: "The total time is 3 + 24 = 27 minutes.",
    vanillaFinal: "27",
    amplified:
      "Since the coffee shop takes 24 minutes, the total is 3 × 60 + 24 = 204 minutes.",
    amplifiedFinal: "204",
    interpretation:
      "The continuation supplies the omitted unit conversion after the clean distribution prefers to break the line.",
    caveat:
      "The token probabilities are paired at one prefix inside the amplified rollout. The displayed Vanilla failure is a separate sampled trajectory.",
  },
  {
    id: "aime-2024-p2",
    problem: "AIME 2024 · Problem 2",
    title: "Include both losing cases in the complement",
    accuracy: "70.3% → 82.8%",
    delta: "+12.5 pp",
    tone: "positive",
    strength: "Primary",
    prefix: "Then X can be 0, 1, 2, 3, or 4.",
    cleanToken: "↵ newline",
    cleanProbability: "0.536",
    editedToken: "We",
    editedProbability: "0.640",
    sampledToken: "We",
    sampledShift: "0.174 → 0.640",
    vanilla: "Counts only X = 0, so the winning count becomes 210 − 15 = 195.",
    vanillaFinal: "196",
    amplified:
      "We want P(X ≥ 2). It is easier to compute 1 − P(X = 0) − P(X = 1), including the missing 80 one-match outcomes.",
    amplifiedFinal: "116",
    interpretation:
      "Continuing the complement argument prevents the model from silently equating ‘no prize’ with zero matches only.",
  },
  {
    id: "aime-2024-p8",
    problem: "AIME 2024 · Problem 8",
    title: "Keep a solved invariant in view",
    accuracy: "45.3% → 49.2%",
    delta: "+3.9 pp",
    tone: "positive",
    strength: "Supporting",
    prefix: "Thus, x = 50/(2y) = 25/y.",
    cleanToken: "↵ newline",
    cleanProbability: "0.936",
    editedToken: "So",
    editedProbability: "0.562",
    sampledToken: "So",
    sampledShift: "0.032 → 0.562",
    vanilla: "Derives xy = 25, then drifts through further substitutions and eventually answers 50.",
    vanillaFinal: "50",
    amplified: "So x = 25/y. The rollout retains xy = 25 as the answer-bearing invariant.",
    amplifiedFinal: "25",
    interpretation:
      "Here the edit does not discover a new equation. It helps preserve an already-derived result across a long continuation.",
    caveat:
      "The full edited derivation is meandering, so this is better treated as a supporting example than a clean causal repair.",
  },
  {
    id: "aime-2025-p0",
    problem: "AIME 2025 · Problem 0",
    title: "Answer the requested sum, not the set",
    accuracy: "93.8% → 98.4%",
    delta: "+4.6 pp",
    tone: "positive",
    strength: "Primary",
    prefix: "The possible values for b are 21 and 49.",
    cleanToken: "↵ newline",
    cleanProbability: "0.364",
    editedToken: "We",
    editedProbability: "0.855",
    sampledToken: "We",
    sampledShift: "0.250 → 0.855",
    vanilla: "Correctly finds both bases, then puts 21, 49 directly in the answer box.",
    vanillaFinal: "21, 49",
    amplified: "We want the sum of the integer bases. In this case, 21 + 49 = 70.",
    amplifiedFinal: "70",
    interpretation:
      "This is the closest analogue to the unit-conversion case: the mathematical objects are correct, but one final instruction still has to be executed.",
  },
  {
    id: "aime-2025-p3",
    problem: "AIME 2025 · Problem 3",
    title: "Remove the overlap between two solution families",
    accuracy: "0.0% → 0.8%",
    delta: "+0.8 pp",
    tone: "positive",
    strength: "Strong",
    prefix: "The pair (0, 0) is a valid solution.",
    cleanToken: "↵ newline",
    cleanProbability: "0.599",
    editedToken: "Since",
    editedProbability: "0.499",
    sampledToken: "We",
    sampledShift: "0.049 → 0.303",
    vanilla: "Adds the two parameterized families directly: 51 + 67 = 118.",
    vanillaFinal: "118",
    amplified:
      "We have counted this solution in both Case 1 and Case 2. Therefore, 51 + 67 − 1 = 117.",
    amplifiedFinal: "117",
    interpretation:
      "The sampled continuation turns the special solution (0, 0) into an explicit inclusion–exclusion correction.",
  },
  {
    id: "aime-2025-p4",
    problem: "AIME 2025 · Problem 4",
    title: "Apply the missing factor-of-two condition",
    accuracy: "0.0% → 2.3%",
    delta: "+2.3 pp",
    tone: "positive",
    strength: "Strong",
    prefix: "The number of integers divisible by 11 is 4608.",
    cleanToken: "↵ newline",
    cleanProbability: "0.495",
    editedToken: "Since",
    editedProbability: "0.773",
    sampledToken: "Since",
    sampledShift: "0.265 → 0.773",
    vanilla: "Stops at the count satisfying divisibility by 11 and returns 4608.",
    vanillaFinal: "4608",
    amplified:
      "Since divisibility by 22 also requires divisibility by 2, the last digit must be even. This gives N = 2304 and N − 2025 = 279.",
    amplifiedFinal: "279",
    interpretation:
      "The connective keeps the argument open long enough to impose the second half of the divisibility criterion.",
  },
  {
    id: "aime-2025-p5",
    problem: "AIME 2025 · Problem 5",
    title: "Restore the half-base difference",
    accuracy: "83.6% → 82.0%",
    delta: "−1.6 pp aggregate",
    tone: "caveat",
    strength: "Strong",
    prefix: "Let the difference in length between the bases be r − s.",
    cleanToken: "Then",
    cleanProbability: "0.822",
    editedToken: "Since",
    editedProbability: "0.829",
    sampledToken: "Since",
    sampledShift: "0.098 → 0.829",
    vanilla:
      "Uses the entire base difference as one right triangle’s horizontal leg, omitting the factor 1/2.",
    vanillaFinal: "342",
    amplified:
      "Since the trapezoid is isosceles, each right triangle has horizontal leg (r − s)/2.",
    amplifiedFinal: "504",
    interpretation:
      "The local trajectory-level repair is unusually crisp: one connective introduces exactly the geometric relation the Vanilla path omitted.",
    caveat:
      "Amplification lowers matched accuracy on this problem overall. This case shows a possible local repair, not a problem-level benefit.",
  },
  {
    id: "aime-2025-p8",
    problem: "AIME 2025 · Problem 8",
    title: "Carry the fourth-quadrant sign constraint forward",
    accuracy: "20.3% → 24.2%",
    delta: "+3.9 pp",
    tone: "positive",
    strength: "Supporting",
    prefix: "We need x > 0 and y < 0 in the fourth quadrant.",
    cleanToken: "↵ newline",
    cleanProbability: "0.622",
    editedToken: "We / Since",
    editedProbability: "≈0.373",
    sampledToken: "Since",
    sampledShift: "0.040 → 0.373",
    vanilla: "Selects the positive radical, obtains y = (3 + √57)/2 > 0, and still concludes.",
    vanillaFinal: "22",
    amplified:
      "Since y = x² − 4, fourth-quadrant membership requires 0 < x < 2. The rollout keeps the negative-sign solution y = (3 − √57)/2.",
    amplifiedFinal: "62",
    interpretation:
      "The continued prose repeatedly reasserts the sign constraint that distinguishes the valid intersection.",
    caveat:
      "The local sign-selection story is clear, although the complete edited derivation is less tidy than the excerpt.",
  },
  {
    id: "aime-2025-p15",
    problem: "AIME 2025 · Problem 15",
    title: "Treat G as a point in the plane",
    accuracy: "7.0% → 8.6%",
    delta: "+1.6 pp",
    tone: "positive",
    strength: "Primary",
    prefix: "Let G = (xG, yG) be a point not on the line. We are given CG = 40 and DG = 30.",
    cleanToken: "↵ newline",
    cleanProbability: "0.357",
    editedToken: "We",
    editedProbability: "0.694",
    sampledToken: "We",
    sampledShift: "0.216 → 0.694",
    vanilla: "Places G on the same number line as B and E, declares the three points collinear, and returns zero area.",
    vanillaFinal: "0",
    amplified:
      "We can use the distance formula: (xG − 26)² + yG² = 1600 and (xG − 40)² + yG² = 900. The height is 24, so the area is 39 × 24 / 2.",
    amplifiedFinal: "468",
    interpretation:
      "The continuation changes the representation of the geometry from a one-dimensional placement problem to two intersecting distance constraints.",
  },
  {
    id: "aime-2025-p16",
    problem: "AIME 2025 · Problem 16",
    title: "Do not discard the smallest feasible divisor",
    accuracy: "89.1% → 83.6%",
    delta: "−5.5 pp aggregate",
    tone: "caveat",
    strength: "Strong",
    prefix: "The positive divisors of 39 are 1, 3, 13, 39.",
    cleanToken: "↵ newline",
    cleanProbability: "0.669",
    editedToken: "Since",
    editedProbability: "0.818",
    sampledToken: "Since",
    sampledShift: "0.103 → 0.818",
    vanilla: "Keeps only n + 2 = 13 or 39, silently dropping the feasible divisor 3 and its solution n = 1.",
    vanillaFinal: "48",
    amplified: "Since n + 2 > 2, the possible values are 3, 13, and 39, giving n = 1, 11, and 37.",
    amplifiedFinal: "49",
    interpretation:
      "The edited continuation states the filter without over-pruning its boundary case.",
    caveat:
      "As with Problem 5, the trajectory is locally helpful while the matched problem-level effect is negative.",
  },
];

export default function TrajectoryCaseStudies() {
  return (
    <div className="trajectory-atlas full-bleed" id="case-atlas">
      <div className="trajectory-atlas-heading">
        <div>
          <span>Trajectory atlas</span>
          <h3>Ten ways that “keep going” changes an answer</h3>
        </div>
        <p>
          Each card pairs a clean and edited next-token distribution at one identical prefix, then
          compares the amplified continuation with a representative Vanilla failure.
        </p>
      </div>

      <div className="trajectory-atlas-stats" aria-label="Trajectory case summary">
        <div><strong>10</strong><span>verified trajectories</span></div>
        <div><strong>8</strong><span>positive problem-level shifts</span></div>
        <div><strong>2</strong><span>local repairs with negative aggregate effects</span></div>
      </div>

      <div className="trajectory-case-list">
        {trajectoryCases.map((item, index) => (
          <details
            className={`trajectory-case trajectory-${item.tone}`}
            data-trajectory-case={item.id}
            key={item.id}
            open={index === 0}
          >
            <summary>
              <span className="trajectory-index">{String(index + 1).padStart(2, "0")}</span>
              <span className="trajectory-summary-copy">
                <small>{item.problem}</small>
                <strong>{item.title}</strong>
              </span>
              <span className="trajectory-accuracy">
                <b>{item.accuracy}</b>
                <small>{item.delta}</small>
              </span>
              <span className={`trajectory-strength strength-${item.strength.toLowerCase()}`}>
                {item.strength}
              </span>
              <i aria-hidden="true">+</i>
            </summary>

            <div className="trajectory-case-body">
              <div className="trajectory-prefix">
                <span>Measured prefix</span>
                <p>“{item.prefix}”</p>
              </div>

              <div className="trajectory-token-grid" aria-label={`${item.problem} next-token shift`}>
                <div className="trajectory-token-clean">
                  <span>Clean top-1</span>
                  <code>{item.cleanToken}</code>
                  <strong>{item.cleanProbability}</strong>
                </div>
                <div className="trajectory-shift-arrow" aria-hidden="true">→</div>
                <div className="trajectory-token-edited">
                  <span>Edited top-1</span>
                  <code>{item.editedToken}</code>
                  <strong>{item.editedProbability}</strong>
                </div>
                <div className="trajectory-sampled-token">
                  <span>Sampled</span>
                  <code>{item.sampledToken}</code>
                  <small>{item.sampledShift}</small>
                </div>
              </div>

              <div className="trajectory-outcomes">
                <div className="trajectory-vanilla">
                  <span>Representative Vanilla failure</span>
                  <p>{item.vanilla}</p>
                  <div>Final <strong>{item.vanillaFinal}</strong></div>
                </div>
                <div className="trajectory-amplified">
                  <span>Amplified rollout · ×3</span>
                  <p>{item.amplified}</p>
                  <div>Final <strong>{item.amplifiedFinal}</strong></div>
                </div>
              </div>

              <p className="trajectory-interpretation">{item.interpretation}</p>
              {item.caveat ? <p className="trajectory-caveat"><strong>Read carefully.</strong> {item.caveat}</p> : null}
            </div>
          </details>
        ))}
      </div>

      <p className="trajectory-atlas-note">
        These are trajectory-level illustrations, not common-prefix Vanilla counterfactuals. The
        problem-level matched accuracy changes provide the stronger evidence about whether a setting
        helps on average.
      </p>
    </div>
  );
}
