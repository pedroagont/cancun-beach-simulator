// Game state
let scene, camera, renderer, player;
let keys = {};
let npcs = [];
let currentNPC = null;
let chatOpen = false;

let localPlayerName = prompt("Enter your name:");
let players = []; // Array of all players including local player
let socket = io(); // For real-time connections

// Movement settings
const MOVE_SPEED = 0.1;
const LOOK_SPEED = 0.02;

// Initialize the game
function init() {
  // Create scene
  scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x87ceeb, 50, 200);

  // Create camera (first person)
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 2.5, 0); // Eye level height

  // Create player object (invisible, just for position tracking)
  player = new THREE.Object3D();
  player.add(camera);
  scene.add(player);

  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x87ceeb);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById("gameContainer").appendChild(renderer.domElement);

  // Create environment
  createEnvironment();
  createLighting();
  createNPCs();

  // socket events
  // When a new player joins from server
  socket.on("newPlayer", (data) => {
    const { id, name, color, x, z } = data;
    // Avoid adding duplicate local player
    if (!players.find((p) => p.userData.id === id)) {
      const newPlayer = createPlayer(name, color, x, z, "Remote player");
      newPlayer.userData.id = id;
      players.push(newPlayer);
    }
  });

  // When server tells a player moved
  socket.on("playerMoved", (data) => {
    const { id, position, rotation } = data;
    const playerObj = players.find((p) => p.userData.id === id);
    if (playerObj) {
      playerObj.position.set(position.x, position.y, position.z);
      playerObj.rotation.y = rotation.y;
    }
  });

  // Send local player info to server
  socket.emit("joinGame", {
    name: localPlayerName,
    color: 0x00ff00,
    x: player.position.x,
    z: player.position.z,
  });

  // Start game loop
  animate();
}

function createEnvironment() {
  // Create street
  const streetGeometry = new THREE.PlaneGeometry(150, 80);
  const streetMaterial = new THREE.MeshLambertMaterial({
    color: 0xaaaaaa,
    transparent: true,
    opacity: 0.9,
  });
  const street = new THREE.Mesh(streetGeometry, streetMaterial);
  street.rotation.x = -Math.PI / 2;
  street.position.z = -10;
  street.position.y = -0.1;
  scene.add(street);

  // Create beach sand
  const sandGeometry = new THREE.PlaneGeometry(150, 70);
  const sandMaterial = new THREE.MeshLambertMaterial({
    color: 0xf4e4bc,
    transparent: true,
    opacity: 0.9,
  });
  const sand = new THREE.Mesh(sandGeometry, sandMaterial);
  sand.rotation.x = -Math.PI / 2;
  sand.receiveShadow = true;
  sand.position.z = -35;
  scene.add(sand);

  // Create ocean
  const oceanGeometry = new THREE.PlaneGeometry(150, 200);
  const oceanMaterial = new THREE.MeshLambertMaterial({
    color: 0x006994,
    transparent: true,
    opacity: 0.9,
  });
  const ocean = new THREE.Mesh(oceanGeometry, oceanMaterial);
  ocean.rotation.x = -Math.PI / 2;
  ocean.position.z = -100;
  ocean.position.y = -0.3;
  scene.add(ocean);

  // Create palm trees
  for (let i = 0; i < 10; i++) {
    createPalmTree((Math.random() - 0.5) * 100, 0, -10);
  }

  // Create beach umbrellas
  for (let i = 0; i < 10; i++) {
    createBeachUmbrella((Math.random() - 0.5) * 100, 0, -50);
  }

  createCancunLetters();
}

function createCancunLetters() {
  const letterColors = [
    0xff4444, // C - Red
    0xff1493, // A - Magenta/Pink
    0xff8c00, // N - Orange
    0xff8c00, // C - Orange
    0x9932cc, // Ú - Purple
    0x9acd32, // N - Light Green
  ];

  const letterSpacing = 8;
  const startX = (-(letterColors.length - 1) * letterSpacing) / 2;
  const letterHeight = 6;
  const letterWidth = 6;
  const letterDepth = 2;

  // Create each letter
  letterColors.forEach((color, index) => {
    const group = new THREE.Group();

    // Create letter base
    const letterGeometry = new THREE.BoxGeometry(
      letterWidth,
      letterHeight,
      letterDepth
    );
    const letterMaterial = new THREE.MeshLambertMaterial({
      color: color,
      transparent: true,
      opacity: 0.9,
    });
    const letter = new THREE.Mesh(letterGeometry, letterMaterial);
    letter.position.z = 10;
    letter.position.y = letterHeight / 2;
    letter.castShadow = true;
    letter.receiveShadow = true;

    // Add some texture with additional shapes
    if (index === 0 || index === 3) {
      // C letters - create the C shape
      const cutoutGeometry = new THREE.BoxGeometry(4, 4, letterDepth + 0.1);
      const cutoutMaterial = new THREE.MeshLambertMaterial({
        color: 0xf4e4bc, // Sand color to "cut out"
        transparent: true,
        opacity: 0.9,
      });
      const cutout = new THREE.Mesh(cutoutGeometry, cutoutMaterial);
      cutout.position.set(1.1, 0, 0);
      letter.add(cutout);
    }

    if (index === 1) {
      // A - create the A shape
      const cutoutGeometry1 = new THREE.BoxGeometry(3, 3, letterDepth + 0.1);
      const cutoutMaterial1 = new THREE.MeshLambertMaterial({
        color: 0xf4e4bc, // Sand color to "cut out"
        transparent: true,
        opacity: 0.9,
      });
      const cutout1 = new THREE.Mesh(cutoutGeometry1, cutoutMaterial1);
      cutout1.position.set(0, -2, 0);
      letter.add(cutout1);

      const cutoutGeometry2 = new THREE.BoxGeometry(3, 1.5, letterDepth + 0.1);
      const cutoutMaterial2 = new THREE.MeshLambertMaterial({
        color: 0xf4e4bc, // Sand color to "cut out"
        transparent: true,
        opacity: 0.9,
      });
      const cutout2 = new THREE.Mesh(cutoutGeometry2, cutoutMaterial2);
      cutout2.position.set(0, 1.5, 0);
      letter.add(cutout2);
    }

    if (index === 2 || index === 5) {
      // N - Create the triangle shaped cutouts
      const triangleShape = new THREE.Shape();
      const triangleWidth = 3;
      const triangleHeight = 4;
      triangleShape.moveTo(0, 0);
      triangleShape.lineTo(triangleWidth, 0);
      triangleShape.lineTo(0, triangleHeight);
      triangleShape.lineTo(0, 0);

      // Extrude the 2D shape into a 3D geometry (a triangular prism).
      const extrudeSettings = {
        steps: 1,
        depth: letterDepth + 0.1, // Make it slightly deeper to prevent visual glitches
        bevelEnabled: false,
      };
      const triangleGeometry = new THREE.ExtrudeGeometry(
        triangleShape,
        extrudeSettings
      );
      const cutoutMaterial = new THREE.MeshLambertMaterial({
        color: 0xf4e4bc, // Sand color to "cut out"
        transparent: true,
        opacity: 0.9,
      });

      // // Cutout 1: For the bottom-left empty space of the 'N'
      const cutout1 = new THREE.Mesh(triangleGeometry, cutoutMaterial);
      cutout1.position.set(-letterWidth / 4, 1 - triangleHeight, -1);
      letter.add(cutout1);

      // Cutout 2: For the top-right empty space of the 'N'
      const cutout2 = new THREE.Mesh(triangleGeometry, cutoutMaterial);
      cutout2.position.set(letterWidth / 3, letterHeight / 2, -1); // Adjusted position for rotation
      cutout2.rotation.z = Math.PI;
      letter.add(cutout2);
    }

    if (index === 4) {
      // Ú - add accent
      const accentGeometry = new THREE.BoxGeometry(1, 0.5, letterDepth);
      const accentMaterial = new THREE.MeshLambertMaterial({
        color: color,
      });
      const accent = new THREE.Mesh(accentGeometry, accentMaterial);
      accent.position.y = letterHeight / 2 + 1;
      accent.rotation.z = Math.PI / 6;
      letter.add(accent);

      const cutoutGeometry = new THREE.BoxGeometry(3, 4, letterDepth + 0.1);
      const cutoutMaterial = new THREE.MeshLambertMaterial({
        color: 0xf4e4bc, // Sand color to "cut out"
        transparent: true,
        opacity: 0.9,
      });
      const cutout = new THREE.Mesh(cutoutGeometry, cutoutMaterial);
      cutout.position.set(0, 1, 0);
      letter.add(cutout);
    }

    group.add(letter);

    // Position the letter
    group.position.set(
      startX + index * letterSpacing,
      0,
      -30 // Place them closer to the ocean for a nice backdrop
    );

    // Add subtle animation
    const originalY = 0;
    const animationOffset = (index * Math.PI) / 3;
    group.userData = {
      originalY,
      animationOffset,
      animate: function (time) {
        this.position.y =
          this.userData.originalY +
          Math.sin(time * 0.001 + this.userData.animationOffset) * 0.2;
        this.rotation.y =
          Math.sin(time * 0.0005 + this.userData.animationOffset) * 0.1;
      },
    };

    scene.add(group);

    // Add to npcs array for animation (reuse the animation system)
    //   npcs.push(group);
  });
}

function createPalmTree(x, y, z) {
  const group = new THREE.Group();

  // Trunk
  const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.5, 8, 8);
  const trunkMaterial = new THREE.MeshLambertMaterial({
    color: 0x8b4513,
  });
  const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
  trunk.position.y = 4;
  trunk.castShadow = true;
  group.add(trunk);

  // --- Leaves (More Realistic) ---
  const leafMaterial = new THREE.MeshLambertMaterial({
    color: 0x228b22,
  });

  // Create multiple leaves using cone geometry
  for (let i = 0; i < 8; i++) {
    // A long, thin cone to represent a single palm frond
    const leafGeometry = new THREE.ConeGeometry(0.5, 5, 8);
    const leaf = new THREE.Mesh(leafGeometry, leafMaterial);

    // Position the leaf at the top of the trunk
    leaf.position.y = 8;

    // Rotate the leaf to fan out from the center
    leaf.rotation.z = Math.random() * 10; // Slight random tilt
    leaf.rotation.y = (i / 8) * Math.PI * 2; // Distribute leaves evenly around the trunk
    leaf.castShadow = true;

    group.add(leaf);
  }

  group.position.set(x, y, z);
  scene.add(group);
}

function createBeachUmbrella(x, y, z) {
  const group = new THREE.Group();

  // Pole
  const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 6);
  const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
  const pole = new THREE.Mesh(poleGeometry, poleMaterial);
  pole.position.y = 2;
  group.add(pole);

  // Umbrella
  const umbrellaGeometry = new THREE.ConeGeometry(3, 1.5, 8);
  const umbrellaMaterial = new THREE.MeshLambertMaterial({
    color: Math.random() > 0.5 ? 0xff6b6b : 0x4ecdc4,
  });
  const umbrella = new THREE.Mesh(umbrellaGeometry, umbrellaMaterial);
  umbrella.position.y = 4.5;
  umbrella.rotation.y = Math.random() * Math.PI;
  umbrella.castShadow = true;
  group.add(umbrella);

  group.position.set(x, y, z);
  scene.add(group);
}

function createLighting() {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
  scene.add(ambientLight);

  // Directional light (sun)
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(50, 50, 25);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 200;
  directionalLight.shadow.camera.left = -50;
  directionalLight.shadow.camera.right = 50;
  directionalLight.shadow.camera.top = 50;
  directionalLight.shadow.camera.bottom = -50;
  scene.add(directionalLight);
}

function createNPCs() {
  const npcData = [
    {
      name: "Maria",
      color: 0xff6b6b,
      x: 10,
      z: 5,
      personality: "friendly beach vendor selling coconuts",
    },
    {
      name: "Carlos",
      color: 0x4ecdc4,
      x: -15,
      z: 8,
      personality: "relaxed surfer dude who loves the waves",
    },
    {
      name: "Isabella",
      color: 0xffe66d,
      x: 20,
      z: -10,
      personality: "local tour guide who knows all the best spots",
    },
    {
      name: "Diego",
      color: 0x95e1d3,
      x: -8,
      z: -15,
      personality: "beach bartender making tropical drinks",
    },
  ];

  npcData.forEach((data) => {
    const npc = createPlayer(
      data.name,
      data.color,
      data.x,
      data.z,
      data.personality
    );
    npcs.push(npc);
  });
}

function createPlayerLabel(name) {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  context.font = "40px Arial";
  context.fillStyle = "white";
  context.fillText(name, 50, 100);

  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(3, 1.5, 1); // Adjust size
  return sprite;
}

function createPlayer(name, color, x, z, personality) {
  const group = new THREE.Group();

  // Body
  const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.7, 1.5, 8);
  const bodyMaterial = new THREE.MeshLambertMaterial({ color: color });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.y = 1.5;
  body.castShadow = true;
  group.add(body);

  // Head
  const headGeometry = new THREE.SphereGeometry(0.4, 8, 6);
  const headMaterial = new THREE.MeshLambertMaterial({ color: 0xffdbac });
  const head = new THREE.Mesh(headGeometry, headMaterial);
  head.position.y = 2.7;
  head.castShadow = true;
  group.add(head);

  // Name label
  const nameLabel = createPlayerLabel(name);
  nameLabel.position.set(0, 4, 0); // Above the head
  group.add(nameLabel);

  // Simple animation
  const originalY = 0;
  let animationOffset = Math.random() * Math.PI * 2;

  group.position.set(x, originalY, z);
  group.userData = {
    name,
    personality,
    originalY,
    animationOffset,
    animate: function (time) {
      this.position.y =
        this.userData.originalY +
        Math.sin(time * 0.002 + this.userData.animationOffset) * 0.1;
      this.rotation.y =
        Math.sin(time * 0.001 + this.userData.animationOffset) * 0.3;
    },
  };

  scene.add(group);
  return group;
}

// Input handling
document.addEventListener("keydown", (event) => {
  keys[event.code] = true;

  if (event.code === "KeyE" && !chatOpen) {
    checkNPCInteraction();
  }

  if (event.code === "Escape") {
    closeChatInterface();
  }

  if (event.code === "Enter" && chatOpen) {
    sendMessage();
  }
});

document.addEventListener("keyup", (event) => {
  keys[event.code] = false;
});

// Chat system
document.getElementById("sendButton").addEventListener("click", sendMessage);
document.getElementById("chatInput").addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

function checkNPCInteraction() {
  const playerPosition = player.position;
  const interactionDistance = 5;

  for (let npc of npcs) {
    const distance = playerPosition.distanceTo(npc.position);
    if (distance < interactionDistance) {
      openChatInterface(npc);
      return;
    }
  }
}

function openChatInterface(npc) {
  const initialMessages = [
    {
      role: "developer",
      content: `You are ${npc.userData.name}, a ${npc.userData.personality}, you are located in Playa Delfines next to the iconic and colorful Cancún letters, respond questions only about Cancún in a friendly way, all your responses must be short, concise and easily to read through a small chat window, if there is any content in lists only separate through commas.`,
    },
  ];
  localStorage.setItem("chatMessages", JSON.stringify(initialMessages));
  currentNPC = npc;
  chatOpen = true;
  document.getElementById("chatInterface").style.display = "block";
  document.getElementById("chatMessages").innerHTML = `
                <div class="npc-message">
                    <strong>${npc.userData.name}:</strong> ¡Hola! Welcome to our beautiful Cancún beach! How can I help you today?
                </div>
            `;
  const input = document.getElementById("chatInput");
  input.focus();
  input.value = "";
}

function closeChatInterface() {
  localStorage.removeItem("chatMessages");
  chatOpen = false;
  currentNPC = null;
  document.getElementById("chatInterface").style.display = "none";
}

async function sendMessage() {
  if (!currentNPC) return;

  const input = document.getElementById("chatInput");
  const message = input.value.trim();
  if (!message) return;

  const messages = JSON.parse(localStorage.getItem("chatMessages"));
  messages.push({ role: "user", content: message });

  // Add user message to chat
  addMessageToChat("user", message);
  input.value = "";

  // Show loading
  document.getElementById("loading").style.display = "block";
  input.disabled = true;

  try {
    const response = await generateAIResponse(messages);
    messages.push({ role: "assistant", content: response });

    localStorage.setItem("chatMessages", JSON.stringify(messages));
    addMessageToChat("npc", response);
  } catch (error) {
    addMessageToChat(
      "npc",
      "¡Perdón! I'm having trouble understanding right now. The connection seems a bit choppy with all this beach wifi!"
    );
  } finally {
    document.getElementById("loading").style.display = "none";
    input.disabled = false;
  }
}

function addMessageToChat(type, message) {
  const chatMessages = document.getElementById("chatMessages");
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${type}-message`;

  if (type === "npc") {
    messageDiv.innerHTML = `<strong>${currentNPC.userData.name}:</strong> ${message}`;
  } else {
    messageDiv.textContent = message;
  }

  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function generateAIResponse(messages) {
  const res = await fetch("/generate-ai-response", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error("AI request failed");
  const data = await res.json();
  return data.reply;
}

// Check for nearby NPCs to show interaction prompt
function checkInteractionPrompt() {
  const playerPosition = player.position;
  const interactionDistance = 5;
  let nearNPC = false;

  for (let npc of npcs) {
    const distance = playerPosition.distanceTo(npc.position);
    if (distance < interactionDistance) {
      nearNPC = true;
      break;
    }
  }

  document.getElementById("interactionPrompt").style.display =
    nearNPC && !chatOpen ? "block" : "none";
}

// Game loop
function animate() {
  requestAnimationFrame(animate);

  const time = Date.now();

  // Handle movement
  if (!chatOpen) {
    handleMovement();
  }

  // Animate NPCs
  npcs.forEach((npc) => {
    if (npc.userData.animate) {
      npc.userData.animate.call(npc, time);
    }
  });

  // Check interaction prompt
  checkInteractionPrompt();

  // Render scene
  renderer.render(scene, camera);
}

// Send local player info to server
socket.emit("joinGame", {
  name: localPlayerName,
  color: 0x00ff00,
  x: player?.position.x,
  z: player?.position.z,
});

function handleMovement() {
  const moveVector = new THREE.Vector3();

  // WASD movement
  if (keys["KeyW"]) moveVector.z -= MOVE_SPEED;
  if (keys["KeyS"]) moveVector.z += MOVE_SPEED;
  if (keys["KeyA"]) moveVector.x -= MOVE_SPEED;
  if (keys["KeyD"]) moveVector.x += MOVE_SPEED;

  // Apply movement relative to player rotation
  moveVector.applyQuaternion(player.quaternion);
  player.position.add(moveVector);

  // Arrow key rotation
  if (keys["ArrowLeft"]) player.rotation.y += LOOK_SPEED;
  if (keys["ArrowRight"]) player.rotation.y -= LOOK_SPEED;

  // Keep player on ground
  player.position.y = 0;

  // Notify server of movement
  socket.emit("move", {
    x: player.position.x,
    y: player.position.y,
    z: player.position.z,
    rotationY: player.rotation.y,
  });
}

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Initialize game
init();
