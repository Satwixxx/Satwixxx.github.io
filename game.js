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

function createGradientTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 1;

    const context = canvas.getContext('2d');
    const gradient = context.createLinearGradient(0, 0, 256, 0);
    gradient.addColorStop(0.0, '#444');
    gradient.addColorStop(0.5, '#FFF');
    gradient.addColorStop(1.0, '#444');

    context.fillStyle = gradient;
    context.fillRect(0, 0, 256, 1);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}

// Initialize the scene
function init() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xFFB6E6); // Cotton candy pink background
    
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    document.body.appendChild(renderer.domElement);

    // Initialize variables for camera control
    let cameraAngle = 0;
    let cameraHeight = 2;
    let mouseSensitivity = 0.002;

    document.addEventListener('mousemove', (event) => {
        if (document.pointerLockElement === renderer.domElement) {
            cameraAngle -= event.movementX * mouseSensitivity;
        }
    });

    const instructions = document.getElementById('instructions');

    instructions.addEventListener('click', function() {
        renderer.domElement.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', function() {
        if (document.pointerLockElement === renderer.domElement) {
            instructions.classList.add('hidden');
        } else {
            instructions.classList.remove('hidden');
        }
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

    // Load a visible, animated, cute girl character model (ReadyPlayerMe demo)
    const loader = new THREE.GLTFLoader();
    loader.load('https://models.readyplayer.me/64e72a2e4e4fde3c9367a3f7.glb', (gltf) => {
        character = gltf.scene;
        character.scale.set(1.2, 1.2, 1.2); // Slightly larger for visibility
        character.position.y = 0;
        character.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                if (node.material) node.material.needsUpdate = true;
            }
        });
        scene.add(character);
        console.log('Character model loaded successfully');

        // Setup character animations
        mixer = new THREE.AnimationMixer(character);
        const animations = gltf.animations;
        if (animations && animations.length > 0) {
            // Try to find best matches for idle, walk, run
            const idleAnim = mixer.clipAction(animations.find(a => a.name.toLowerCase().includes('idle')) || animations[0]);
            const walkAnim = mixer.clipAction(animations.find(a => a.name.toLowerCase().includes('walk')) || animations[1]);
            const runAnim = mixer.clipAction(animations.find(a => a.name.toLowerCase().includes('run')) || animations[2]);
            idleAnim.play();
            currentAnimation = 'idle';
            character.animations = { idle: idleAnim, walk: walkAnim, run: runAnim };
        }
    }, undefined, (error) => {
        console.error('Error loading character model:', error);
        // Fallback: create a simple visible character
        const geometry = new THREE.CapsuleGeometry(0.5, 1.5, 4, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0xff69b4 });
        character = new THREE.Mesh(geometry, material);
        character.position.y = 0.75;
        character.castShadow = true;
        character.receiveShadow = true;
        scene.add(character);
        console.log('Fallback character created');
    });

    camera.position.set(0, 2, 5);
    camera.lookAt(0, 1, 0);

    // Event listeners for controls
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);
}

function createRoom() {
    // Create realistic wood floor
    const floorGeometry = new THREE.BoxGeometry(20, 0.2, 20);
    const floorTexture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/hardwood2_diffuse.jpg');
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(4, 4);
    
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        map: floorTexture,
        roughness: 0.8,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.position.y = -0.1; // Slightly below 0 to avoid z-fighting
    floor.receiveShadow = true;
    scene.add(floor);

    // Create realistic walls
    const wallGeometry = new THREE.BoxGeometry(0.3, 10, 20);
    const wallTexture = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/brick_diffuse.jpg');
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(2, 4);

    const wallMaterial = new THREE.MeshStandardMaterial({
        map: wallTexture,
        roughness: 0.7,
        metalness: 0.1
    });

    // Back wall
    const backWall = new THREE.Mesh(
        new THREE.BoxGeometry(20, 10, 0.3),
        wallMaterial.clone()
    );
    backWall.position.z = -10;
    backWall.position.y = 5;
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
        wallGeometry,
        wallMaterial.clone()
    );
    leftWall.position.x = -10;
    leftWall.position.y = 5;
    leftWall.castShadow = true;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
        wallGeometry,
        wallMaterial.clone()
    );
    rightWall.position.x = 10;
    rightWall.position.y = 5;
    rightWall.castShadow = true;
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Add some furniture and decorations
    // Window
    const windowFrame = new THREE.Mesh(
        new THREE.BoxGeometry(4, 6, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 })
    );
    windowFrame.position.set(0, 5, -9.8);
    scene.add(windowFrame);

    // Window glass
    const windowGlass = new THREE.Mesh(
        new THREE.PlaneGeometry(3.6, 5.6),
        new THREE.MeshPhysicalMaterial({
            color: 0xaaaaff,
            transparent: true,
            opacity: 0.3,
            metalness: 1,
            roughness: 0,
            envMapIntensity: 1
        })
    );
    windowGlass.position.set(0, 5, -9.6);
    scene.add(windowGlass);
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
    
    if (character && document.pointerLockElement === renderer.domElement) {
        // Calculate movement direction based on camera angle
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveLeft) - Number(moveRight);
        direction.y = 0;
        let isMoving = false;
        if (direction.length() > 0) {
            direction.normalize();
            isMoving = true;
            // Calculate movement based on camera angle
            const moveSpeed = 0.12;
            const moveVector = new THREE.Vector3();
            moveVector.x = direction.x * Math.cos(cameraAngle) + direction.z * Math.sin(cameraAngle);
            moveVector.z = direction.z * Math.cos(cameraAngle) - direction.x * Math.sin(cameraAngle);
            // Apply movement
            character.position.x += moveVector.x * moveSpeed;
            character.position.z += moveVector.z * moveSpeed;
            // Rotate character to face movement direction
            const targetAngle = Math.atan2(moveVector.x, moveVector.z);
            character.rotation.y = targetAngle;
        }
        // Animation blending
        if (character.animations) {
            if (isMoving && currentAnimation !== 'walk' && character.animations.walk) {
                const walkAnim = character.animations.walk;
                const currentAnim = character.animations[currentAnimation];
                if (currentAnim && walkAnim) currentAnim.crossFadeTo(walkAnim, 0.2, true);
                walkAnim.play();
                currentAnimation = 'walk';
            } else if (!isMoving && currentAnimation !== 'idle' && character.animations.idle) {
                const idleAnim = character.animations.idle;
                const currentAnim = character.animations[currentAnimation];
                if (currentAnim && idleAnim) currentAnim.crossFadeTo(idleAnim, 0.2, true);
                idleAnim.play();
                currentAnimation = 'idle';
            }
        }
        // Apply gravity and jumping
        velocity.y -= 20 * delta;
        character.position.y += velocity.y * delta;
        if (character.position.y < 0) {
            velocity.y = 0;
            character.position.y = 0;
            canJump = true;
        }
        // Update camera position based on character and mouse movement
        const cameraDistance = 5;
        const cameraHeight = 2;
        camera.position.x = character.position.x - Math.sin(cameraAngle) * cameraDistance;
        camera.position.z = character.position.z - Math.cos(cameraAngle) * cameraDistance;
        camera.position.y = character.position.y + cameraHeight;
        camera.lookAt(
            character.position.x,
            character.position.y + 1.5,
            character.position.z
        );
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
