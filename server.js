import { createServer } from 'net';
import { createInterface } from 'readline';

const participants = new Set();
let preparedParticipants = new Set();
//  no transction intially
let currentTransaction = null;
//  to check any transaction currently in progress
    let tP = false;

const con = { atleast_n: 'atleast_n', atmost_n: 'at_most_n', all_prep: 'all_prep' };
let currentcon = con.all_prep;
let N = 1;

const server = createServer((socket) => {
  participants.add(socket);
  console.log('Client connected.\nTotal:', participants.size);

  socket.on('data', (data) => {
    if (data.toString().trim() === 'PREPARED') {
      preparedParticipants.add(socket);
      console.log('Participant prepared.\nTotal:', preparedParticipants.size);
      checkAndCommit();
    } });

  socket.on('close', () => {
    participants.delete(socket);
    preparedParticipants.delete(socket);
    console.log('Participant disconnected.\nTotal:', participants.size); });

// err Handnling
  socket.on('error', (err) => console.log('Socket error:', err.message));
});

function startTransaction(transaction) {
  if (participants.size === 0) {
        console.log('No participants connected.\n');
    return promptTransac();
  }

tP = true;
currentTransaction = transaction;
preparedParticipants.clear();

//   Preparint the participants
  participants.forEach(p => 
    p.write(`PREPARE:${transaction}\n`));
  setTimeout(() => 
    checkAndCommit(true), 10000);
}

function checkAndCommit(isTimeout = false) {
//  in this i check whether the configuration is met or not 
  const shouldCommit = 
    (currentcon === con.atleast_n && preparedParticipants.size >= N) ||
    (currentcon === con.atmost_n && preparedParticipants.size <= N) ||
    (currentcon === con.all_prep && preparedParticipants.size >0);
//  after condotion satisfaction i go on to commiting phase
  if (shouldCommit && isTimeout) {
    console.log('Committing...');
    preparedParticipants.forEach(p => p.write(`COMMIT:${currentTransaction}\n`));
    console.log('Transaction committed successfully.');
    finishTransaction();
  } 
//  handling errors && condition unsatisfication 
  else if (isTimeout) {
    console.log('Commit conditions not met.\nAborting.');
    participants.forEach(p => p.write('ABORT\n'));
    finishTransaction();
  }
}

//  setting the values back after the transaction
    function finishTransaction() {
    currentTransaction = null;
    tP = false;
    promptTransac();
    }


//  a console like menu to choose configurations
function promptconf() {
  rl.question('Select con\n1: At least N\n2: At most N\n3: All prepared\n', (choice) => {
    if (choice === '1' || choice === '2') {
      currentcon = choice === '1' ? con.atleast_n : con.atmost_n;
      rl.question('Enter N value: ', (n) => {
        N = parseInt(n);
        console.log(`configuration set to: ${currentcon === con.atleast_n ? 'At least' : 'At most'} ${N} prepared`);
        promptTransac();
      });

    } 
    else if (choice === '3') {
      currentcon = con.all_prep;
      console.log('con set to: All prepared');
      promptTransac();
    }
    else {
      console.log('Invalid choice. Try again.');
      promptconf();
    } });
}

function promptTransac() {
  if (!tP) {
    rl.question('Enter message\n("con" to change, "exit" to quit): \n', (input) => {
            if (input.toLowerCase() === 'exit') return rl.close();
            if (input.toLowerCase() === 'con') return promptconf();
      startTransaction(input);
    }); } }



const port = 7890;

const rl = createInterface({ 
    input: process.stdin, 
    output: process.stdout });

server.listen(port, () => {
    console.log(`Coordinator listening on port ${port}`);
    promptconf();
    });