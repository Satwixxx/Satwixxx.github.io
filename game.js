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

    // Initialize pointer lock controls
    controls = new THREE.PointerLockControls(camera, renderer.domElement);

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

    // Load character model (using a more cartoon-style character)
    const loader = new THREE.GLTFLoader();
    loader.load('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF/Duck.gltf', (gltf) => {
        character = gltf.scene;
        character.scale.set(0.5, 0.5, 0.5);
        character.position.y = 0.5;
        
        // Apply cartoon shader to character
        character.traverse((node) => {
            if (node.isMesh) {
                const material = new THREE.MeshToonMaterial({
                    color: 0xFFD700, // Golden yellow color
                    gradientMap: createGradientTexture(),
                    emissive: 0x666666,
                    specular: 0xffffff,
                    shininess: 30
                });
                node.material = material;
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });
        
        scene.add(character);
        
        // Set initial camera position relative to character
        camera.position.set(character.position.x, character.position.y + 3, character.position.z + 5);
        camera.lookAt(character.position);
    });

    camera.position.set(0, 2, 5);
    camera.lookAt(0, 1, 0);

    // Event listeners for controls
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    window.addEventListener('resize', onWindowResize);
}

function createRoom() {
    // Create candy-themed decorative elements
    const createCandy = (x, y, z, color) => {
        const candy = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 8, 8),
            new THREE.MeshToonMaterial({ color: color })
        );
        candy.position.set(x, y, z);
        candy.castShadow = true;
        scene.add(candy);
    };

    // Floor with candy pattern
    const floorGeometry = new THREE.PlaneGeometry(20, 20, 20, 20);
    const vertices = floorGeometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
        vertices[i + 1] = Math.sin(vertices[i] * 0.5) * Math.cos(vertices[i + 2] * 0.5) * 0.2;
    }
    
    const floorMaterial = new THREE.MeshToonMaterial({ 
        color: 0xFF70A6, // Bright candy pink
        gradientMap: createGradientTexture()
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls with cartoon style
    const wallMaterial = new THREE.MeshToonMaterial({ 
        color: 0x9EE5FF,
        gradientMap: createGradientTexture()
    });

    // Back wall with candy decorations
    const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 10),
        wallMaterial.clone()
    );
    backWall.position.z = -10;
    backWall.position.y = 5;
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Add lollipop decorations to back wall
    for(let i = -8; i <= 8; i += 4) {
        createCandy(i, 8, -9.8, 0xFF4D4D);
    }

    // Left wall with candy stripes
    const leftWall = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 10),
        new THREE.MeshToonMaterial({ 
            color: 0xFFB6E6,
            gradientMap: createGradientTexture()
        })
    );
    leftWall.position.x = -10;
    leftWall.position.y = 5;
    leftWall.rotation.y = Math.PI / 2;
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right wall with candy decorations
    const rightWall = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 10),
        new THREE.MeshToonMaterial({ 
            color: 0xA5FFD6,
            gradientMap: createGradientTexture()
        })
    );
    rightWall.position.x = 10;
    rightWall.position.y = 5;
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Add floating candy decorations
    for(let i = 0; i < 20; i++) {
        const x = Math.random() * 16 - 8;
        const y = Math.random() * 6 + 2;
        const z = Math.random() * 16 - 8;
        const color = new THREE.Color().setHSL(Math.random(), 0.7, 0.6);
        createCandy(x, y, z, color);
    }
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
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveLeft) - Number(moveRight);
        direction.y = 0;
        direction.normalize();

        // Move relative to camera direction
        const moveSpeed = 0.15;
        if (moveForward || moveBackward || moveLeft || moveRight) {
            // Calculate movement based on camera direction
            const angle = Math.atan2(cameraDirection.x, cameraDirection.z);
            const movementVector = new THREE.Vector3();
            
            // Forward/backward movement
            movementVector.z = direction.z * Math.cos(angle) + direction.x * Math.sin(angle);
            movementVector.x = direction.z * Math.sin(angle) - direction.x * Math.cos(angle);
            
            character.position.x += movementVector.x * moveSpeed;
            character.position.z += movementVector.z * moveSpeed;

            // Rotate character to face movement direction
            if (movementVector.length() > 0) {
                const targetAngle = Math.atan2(movementVector.x, movementVector.z);
                character.rotation.y = targetAngle;
            }

            // Add a slight bob animation while moving
            character.position.y = 0.5 + Math.sin(Date.now() * 0.01) * 0.05;
        }

        // Apply gravity
        velocity.y -= 30 * delta;
        character.position.y += velocity.y * delta;

        // Ground check with minimum height
        if (character.position.y < 0.5) {
            velocity.y = 0;
            character.position.y = 0.5;
            canJump = true;
        }

        // Smooth camera follow
        const idealOffset = new THREE.Vector3(
            -Math.sin(character.rotation.y) * 4,
            3,
            -Math.cos(character.rotation.y) * 4
        );
        
        const idealLookat = new THREE.Vector3(
            character.position.x,
            character.position.y + 1,
            character.position.z
        );

        // Smoothly interpolate camera position
        const currentPosition = camera.position;
        const smoothSpeed = 0.1;
        
        camera.position.x = character.position.x + idealOffset.x;
        camera.position.y = character.position.y + idealOffset.y;
        camera.position.z = character.position.z + idealOffset.z;
        
        // Make camera look at character
        camera.lookAt(idealLookat);
    }

    // Add a gentle floating rotation when idle
    if (!moveForward && !moveBackward && !moveLeft && !moveRight) {
        character.rotation.y += delta * 0.5;
    }
}

function animate() {
    requestAnimationFrame(animate);
    updateCharacterPosition();
    renderer.render(scene, camera);
}

init();
animate();
