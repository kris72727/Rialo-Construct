// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add lighting
scene.add(new THREE.AmbientLight(0x606060));
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
directionalLight.position.set(10, 20, 10);
scene.add(directionalLight);

// Set camera position
camera.position.set(10, 10, 10);
camera.lookAt(0, 0, 0);

// Add a flat ground plane
const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMaterial = new THREE.MeshPhongMaterial({ color: 0xcccccc, side: THREE.DoubleSide });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = Math.PI / 2;
scene.add(ground);

// --- Game Variables ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const objects = [ground]; // Array to store objects for raycasting
let currentBlock;
let rotationY = 0; // Current rotation in degrees
const ROTATION_STEP = 90; // Rotate by 90 degrees

// Placeholder for the "Rialo Box" geometry (using a simple cube for simplicity)
// NOTE: For the actual Rialo look, you would replace this with a custom JSON/GLTF model
const BLOCK_SIZE = 1;
const blockGeometry = new THREE.BoxGeometry(BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
const ghostMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
const placedMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 }); // Rialo Black

// --- Functions ---

function spawnNewGhostBlock() {
    // Remove old ghost if it exists
    if (currentBlock) {
        scene.remove(currentBlock);
    }
    
    // Create the new ghost block
    currentBlock = new THREE.Mesh(blockGeometry, ghostMaterial);
    currentBlock.rotation.y = THREE.MathUtils.degToRad(rotationY);
    scene.add(currentBlock);
}

function placeBlock() {
    if (!currentBlock) return;

    // 1. Create a permanent placed block
    const placedBlock = new THREE.Mesh(blockGeometry, placedMaterial);
    placedBlock.position.copy(currentBlock.position);
    placedBlock.rotation.copy(currentBlock.rotation);
    scene.add(placedBlock);
    
    // Add the new block to the array for future raycasting
    objects.push(placedBlock);

    // 2. Spawn a new ghost block for the next placement
    spawnNewGhostBlock();
}

function onMouseMove(event) {
    // Calculate mouse position in normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Check for intersections with the ground and placed blocks
    const intersects = raycaster.intersectObjects(objects);

    if (intersects.length > 0 && currentBlock) {
        // Get the point of intersection
        const intersect = intersects[0];
        
        // Snap the position to a grid (e.g., to 1.0 unit grid)
        const newPos = intersect.point.clone().divideScalar(BLOCK_SIZE).floor().multiplyScalar(BLOCK_SIZE).addScalar(BLOCK_SIZE / 2);
        
        // Adjust for block size if placing on top of a block
        if (intersect.object !== ground) {
            newPos.y = intersect.object.position.y + BLOCK_SIZE;
        }

        currentBlock.position.copy(newPos);
    }
}

function onDocumentClick() {
    placeBlock();
}

function onKeyPress(event) {
    if (event.key === 'r' || event.key === 'R') { // Press 'R' to rotate
        rotationY += ROTATION_STEP;
        if (rotationY >= 360) rotationY = 0;
        
        if (currentBlock) {
            currentBlock.rotation.y = THREE.MathUtils.degToRad(rotationY);
        }
    }
}

// --- Event Listeners ---
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('click', onDocumentClick, false);
window.addEventListener('keydown', onKeyPress, false);
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);


// --- Game Loop ---
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Start the game
spawnNewGhostBlock();
animate();

