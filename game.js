let scene, camera, renderer, character, mixer;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = true;
let velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const clock = new THREE.Clock();
let controls;
let currentAnimation = null;

// Initialize the scene
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(renderer.domElement);

    // Initialize pointer lock controls
    controls = new THREE.PointerLockControls(camera, document.body);

    const instructions = document.getElementById('instructions');

    instructions.addEventListener('click', function() {
        controls.lock();
    });

    controls.addEventListener('lock', function() {
        instructions.classList.add('hidden');
    });

    controls.addEventListener('unlock', function() {
        instructions.classList.remove('hidden');
    });

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create room
    createRoom();

    // Load character model
    const loader = new THREE.GLTFLoader();
    loader.load('https://threejs.org/examples/models/gltf/Xbot.glb', (gltf) => {
        character = gltf.scene;
        character.scale.set(0.8, 0.8, 0.8);
        character.position.y = 0;
        scene.add(character);

        mixer = new THREE.AnimationMixer(character);
        const animations = gltf.animations;
        const idleAnimation = mixer.clipAction(animations[0]);
        const walkAnimation = mixer.clipAction(animations[3]);
        idleAnimation.play();
    });

    camera.position.set(0, 2, 5);
    camera.lookAt(0, 1, 0);

    // Event listeners for controls
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);
}

function createRoom() {
    // Floor with candy-themed texture
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFF9ECD, // Pink candy color
        roughness: 0.3,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls with candy-themed colors
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x9EE5FF, // Light blue
        roughness: 0.3,
        metalness: 0.1
    });

    // Back wall
    const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 10),
        wallMaterial.clone()
    );
    backWall.position.z = -10;
    backWall.position.y = 5;
    backWall.receiveShadow = true;
    backWall.castShadow = true;
    scene.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 10),
        new THREE.MeshStandardMaterial({ 
            color: 0xFFB6C1, // Light pink
            roughness: 0.3,
            metalness: 0.1
        })
    );
    leftWall.position.x = -10;
    leftWall.position.y = 5;
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    leftWall.castShadow = true;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 10),
        new THREE.MeshStandardMaterial({ 
            color: 0x98FF98, // Mint green
            roughness: 0.3,
            metalness: 0.1
        })
    );
    rightWall.position.x = 10;
    rightWall.position.y = 5;
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    rightWall.castShadow = true;
    scene.add(rightWall);
}

function onKeyDown(event) {
    switch(event.code) {
        case 'KeyW':
            moveForward = true;
            break;
        case 'KeyS':
            moveBackward = true;
            break;
        case 'KeyA':
            moveLeft = true;
            break;
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            if (canJump) {
                velocity.y += 350;
                canJump = false;
            }
            break;
    }
}

function onKeyUp(event) {
    switch(event.code) {
        case 'KeyW':
            moveForward = false;
            break;
        case 'KeyS':
            moveBackward = false;
            break;
        case 'KeyA':
            moveLeft = false;
            break;
        case 'KeyD':
            moveRight = false;
            break;
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function updateCharacterPosition() {
    const delta = clock.getDelta();
    
    if (character && controls.isLocked) {
        // Get camera direction
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        
        // Calculate movement direction relative to camera
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.z = Number(moveBackward) - Number(moveForward);
        direction.y = 0;
        direction.normalize();

        // Adjust movement direction based on camera rotation
        const moveSpeed = 0.15;
        if (moveForward || moveBackward || moveLeft || moveRight) {
            const angle = Math.atan2(cameraDirection.x, cameraDirection.z);
            const rotatedDirection = direction.clone();
            rotatedDirection.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
            
            character.position.x += rotatedDirection.x * moveSpeed;
            character.position.z += rotatedDirection.z * moveSpeed;

            // Rotate character to face movement direction
            if (direction.x !== 0 || direction.z !== 0) {
                character.rotation.y = angle + Math.atan2(direction.x, direction.z);
            }

            // Switch to running animation
            if (mixer && currentAnimation !== 'run') {
                const runAnimation = mixer.clipAction(mixer._actions[3]._clip);
                if (currentAnimation) {
                    const currentAnim = mixer.clipAction(mixer._actions[0]._clip);
                    currentAnim.crossFadeTo(runAnimation, 0.2, true);
                }
                runAnimation.play();
                currentAnimation = 'run';
            }
        } else if (currentAnimation !== 'idle' && mixer) {
            // Switch back to idle animation
            const idleAnimation = mixer.clipAction(mixer._actions[0]._clip);
            const currentAnim = mixer.clipAction(mixer._actions[3]._clip);
            currentAnim.crossFadeTo(idleAnimation, 0.2, true);
            idleAnimation.play();
            currentAnimation = 'idle';
        }

        // Apply gravity
        velocity.y -= 20 * delta; // Increased gravity for better feel
        character.position.y += velocity.y * delta;

        // Ground check
        if (character.position.y < 0) {
            velocity.y = 0;
            character.position.y = 0;
            canJump = true;
        }

        // Update camera position to follow character
        const cameraOffset = new THREE.Vector3(0, 2, 5);
        camera.position.copy(character.position).add(cameraOffset);
    }

    if (mixer) {
        mixer.update(delta);
    }
}

function animate() {
    requestAnimationFrame(animate);
    updateCharacterPosition();
    renderer.render(scene, camera);
}

init();
animate();
