export function add([a, b]: [number, number]) {
  return a + b;
}

export function makeName(
  { firstName, lastName }: { firstName: string; lastName: string },
  { text }: { text: string },
) {
  return `${text || "Hello"} ${firstName} ${lastName}`;
}

export function animalsMakeNoise(noise: string[]) {
  return noise.map((el) => el.toUpperCase()).join(" ");
}
