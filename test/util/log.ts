require('dotenv').config({ path: '.env' });

/**
 * if .env file contains DEBUG_LOGGING_IN_TESTS=true then log will be printed
 *
 * For use inside unit test files.
 *
 * @param args Same parameters as console.log
 */
export function log(...args: any) {
  if (['true', 1, 'yes', 'on'].includes(process.env.DEBUG_LOGGING_IN_TESTS as any)) {
    console.log(...args);
  }
}
