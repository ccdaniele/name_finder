export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

export function normalizedSimilarity(a: string, b: string): number {
  const lowerA = a.toLowerCase();
  const lowerB = b.toLowerCase();
  const maxLen = Math.max(lowerA.length, lowerB.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(lowerA, lowerB) / maxLen;
}

export function soundex(str: string): string {
  const s = str.toUpperCase().replace(/[^A-Z]/g, "");
  if (!s) return "0000";

  const map: Record<string, string> = {
    B: "1", F: "1", P: "1", V: "1",
    C: "2", G: "2", J: "2", K: "2", Q: "2", S: "2", X: "2", Z: "2",
    D: "3", T: "3",
    L: "4",
    M: "5", N: "5",
    R: "6",
  };

  let result = s[0];
  let lastCode = map[s[0]] || "";

  for (let i = 1; i < s.length && result.length < 4; i++) {
    const code = map[s[i]] || "";
    if (code && code !== lastCode) {
      result += code;
    }
    lastCode = code || lastCode;
  }

  return result.padEnd(4, "0");
}

export function phoneticSimilarity(a: string, b: string): number {
  const soundexMatch = soundex(a) === soundex(b) ? 0.3 : 0;
  const editSimilarity = normalizedSimilarity(a, b) * 0.7;
  return soundexMatch + editSimilarity;
}
