const { spawn } = require('child_process');
const path = require('path');

// Démarrer le serveur backend
console.log('Démarrage du serveur backend...');
const serverProcess = spawn('node', [path.join(__dirname, 'server', 'index.js')], {
  stdio: 'inherit',
  shell: true
});

serverProcess.on('error', (error) => {
  console.error('Erreur lors du démarrage du serveur backend:', error);
});

// Attendre un peu pour que le serveur démarre
setTimeout(() => {
  // Démarrer l'application frontend
  console.log('Démarrage de l\'application frontend...');
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true,
    cwd: path.join(__dirname, 'web-app')
  });

  frontendProcess.on('error', (error) => {
    console.error('Erreur lors du démarrage de l\'application frontend:', error);
  });

  // Gérer la fermeture propre des processus
  process.on('SIGINT', () => {
    console.log('Arrêt des processus...');
    serverProcess.kill();
    frontendProcess.kill();
    process.exit();
  });
}, 2000);

console.log('Pour arrêter les deux serveurs, appuyez sur Ctrl+C');
