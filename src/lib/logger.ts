import fs from 'fs';
import path from 'path';

export function logAuthDebug(message: string, data?: any) {
  try {
    const logPath = path.join(process.cwd(), 'auth-debug.log');
    const timestamp = new Date().toISOString();
    let logMessage = `[${timestamp}] ${message}`;
    if (data) {
      if (data instanceof Error) {
        logMessage += `\nError: ${data.name} - ${data.message}\nStack: ${data.stack}`;
      } else {
        logMessage += `\nData: ${JSON.stringify(data, null, 2)}`;
      }
    }
    logMessage += '\n';
    
    // Also console.log for standard output
    console.log(logMessage.trim());
    
    fs.appendFileSync(logPath, logMessage);
  } catch (err) {
    console.error("Failed to write to debug log", err);
  }
}
