// The spec lives in spec.jsonl so `$template` values can contain `${...}` freely.
// Replace spec.jsonl with any JSONL spec; seed state with an
// {"op":"add","path":"/state",...} line.
import specJsonl from "./spec.jsonl?raw";

export { specJsonl };
