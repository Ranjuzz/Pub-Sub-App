import { time } from 'console';
import { Socket } from 'net';
import { createInterface } from 'readline';

const client = new Socket();
const port = 7890;


function connectToServer() {
  client.connect(port, 'localhost', () => {
    console.log('Connected to server');
  }); }

//   this is used to interface with CLI
const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

// a function wriiten by me to get input from a cmd line
//  if no input is given in 9 sec then the value is set to No
function askQuestion(query, timeout = 9000) {
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        rl.close();
        resolve('no'); 
      }, timeout);
  
      rl.question(query, answer => {
        clearTimeout(timer);
        resolve(answer);
        rl.close();
      });
    });
  }

const date = new Date();
client.on('data', async(data) => {
  const message = data.toString().trim();
  
  if (message.startsWith('PREPARE:')) {
    const content = message.slice(8);
    console.log('Are you prepaerd?');
    try {
        const res = await askQuestion('(y/n): ');
        if(res.toLowerCase() === 'y') {
            client.write('PREPARED\n');
            console.log('Sent PREPARED response'); } 
        else {
            console.log('Did not send PREPARED response');} 
    } 
    catch (error) {
      console.error('Error getting response:', error);
    }
  } 
  else if (message.startsWith('COMMIT:')) {
    const content = message.slice(7);
    if(content === 'null') {}
    else
        console.log('Message:', content);
  } 
  else if (message === 'ABORT') {
    console.log('Transaction aborted');
  }
});

client.on('close', () => {
  console.log('Connection closed. \nAttempting to reconnect...');
    setTimeout(connectToServer, 5000); });

client.on('error', (err) => {
    console.log('Connection error:', err.message); });

connectToServer();