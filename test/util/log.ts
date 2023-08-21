require("dotenv").config({ path: ".env" });

export function log(...args: any) {
  if(['true', 1, 'yes', 'on'].includes(process.env.DEBUG_LOGGING_IN_TESTS as any)) {
    console.log(...args);
  }
}
