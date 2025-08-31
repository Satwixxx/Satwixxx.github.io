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
// Define global camera variables
let cameraAngle = 0;
let cameraHeight = 2;
let mouseSensitivity = 0.002;

function init() {
    // Create scene with simple background
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue background
    
    // Set up camera with reasonable parameters
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 1, 0);
    
    // Configure renderer with simpler settings to avoid compatibility issues
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    
    // Simple renderer configuration without advanced features that might cause problems
    try {
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    } catch (e) {
        console.warn("Error setting shadow map type", e);
    }
    
    document.body.appendChild(renderer.domElement);
    
    // Check if renderer was successfully created
    if (!renderer.domElement) {
        console.error("Failed to create renderer");
        alert("Failed to initialize 3D renderer. Please check your browser compatibility.");
        return;
    }

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
            if (instructions) instructions.classList.add('hidden');
        } else {
            if (instructions) instructions.classList.remove('hidden');
        }
    });
    
    // Add error handling for instructions element
    if (!instructions) {
        console.warn("Instructions element not found, creating one");
        const newInstructions = document.createElement('div');
        newInstructions.id = 'instructions';
        newInstructions.innerHTML = 'Click to play<br>WASD = Move<br>SPACE = Jump<br>MOUSE = Look around<br>ESC = Pause';
        newInstructions.style.position = 'absolute';
        newInstructions.style.top = '50%';
        newInstructions.style.left = '50%';
        newInstructions.style.transform = 'translate(-50%, -50%)';
        newInstructions.style.textAlign = 'center';
        newInstructions.style.color = 'white';
        newInstructions.style.backgroundColor = 'rgba(0,0,0,0.7)';
        newInstructions.style.padding = '20px';
        newInstructions.style.borderRadius = '10px';
        newInstructions.style.fontFamily = 'Arial, sans-serif';
        document.body.appendChild(newInstructions);
        
        newInstructions.addEventListener('click', function() {
            renderer.domElement.requestPointerLock();
        });
    }

    // Add strong lighting to ensure visibility
    // Ambient light ensures everything is at least somewhat visible
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Brighter ambient
    scene.add(ambientLight);

    // Main directional light (like the sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Full intensity
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);
    
    // Additional light to ensure character is well-lit
    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    pointLight.position.set(0, 5, 2);
    scene.add(pointLight);

    // Create room
    createRoom();

    // Create a detailed doll character as fallback
    try {
        // Create a doll-like female character using primitive shapes
        character = new THREE.Group();
        
        // Body - dress shape
        const dressGeometry = new THREE.ConeGeometry(0.4, 1.2, 8);
        const dressMaterial = new THREE.MeshStandardMaterial({ color: 0xff9ddb }); // Pink dress
        const dress = new THREE.Mesh(dressGeometry, dressMaterial);
        dress.position.y = 0.6;
        dress.castShadow = true;
        character.add(dress);
        
        // Upper body/torso
        const torsoGeometry = new THREE.CapsuleGeometry(0.25, 0.3, 4, 8);
        const torsoMaterial = new THREE.MeshStandardMaterial({ color: 0xff9ddb }); // Pink to match dress
        const torso = new THREE.Mesh(torsoGeometry, torsoMaterial);
        torso.position.y = 1.25;
        torso.rotation.x = Math.PI / 2;
        torso.castShadow = true;
        character.add(torso);
        
        // Head
        const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
        const headMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac }); // Skin tone
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.65;
        head.castShadow = true;
        character.add(head);
        
        // Cheeks/blush
        const blushGeometry = new THREE.CircleGeometry(0.05, 8);
        const blushMaterial = new THREE.MeshBasicMaterial({ color: 0xff9999 }); // Pink blush
        const leftBlush = new THREE.Mesh(blushGeometry, blushMaterial);
        leftBlush.position.set(0.15, 1.65, 0.2);
        leftBlush.rotation.y = -Math.PI/2;
        character.add(leftBlush);
        
        const rightBlush = new THREE.Mesh(blushGeometry, blushMaterial);
        rightBlush.position.set(-0.15, 1.65, 0.2);
        rightBlush.rotation.y = Math.PI/2;
        character.add(rightBlush);
        
        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 }); // Black eyes
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.1, 1.7, 0.2);
        character.add(leftEye);
        
        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.1, 1.7, 0.2);
        character.add(rightEye);
        
        // Mouth
        const mouthGeometry = new THREE.BoxGeometry(0.12, 0.03, 0.03);
        const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0xff5555 }); // Red lips
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, 1.55, 0.24);
        character.add(mouth);
        
        // Hair - long hair for doll
        const hairGeometry = new THREE.CylinderGeometry(0.27, 0.2, 1.0, 8);
        const hairMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown hair
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.y = 1.45;
        hair.castShadow = true;
        character.add(hair);
        
        // Hair bangs
        const bangsGeometry = new THREE.BoxGeometry(0.5, 0.15, 0.2);
        const bangsMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 }); // Brown hair
        const bangs = new THREE.Mesh(bangsGeometry, bangsMaterial);
        bangs.position.set(0, 1.85, 0.15);
        bangs.castShadow = true;
        character.add(bangs);
        
        // Arms
        const armGeometry = new THREE.CapsuleGeometry(0.08, 0.5, 4, 8);
        const armMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac }); // Skin tone
        
        const leftArm = new THREE.Mesh(armGeometry, armMaterial);
        leftArm.position.set(0.4, 1.25, 0);
        leftArm.rotation.z = -Math.PI/4;
        leftArm.castShadow = true;
        character.add(leftArm);
        
        const rightArm = new THREE.Mesh(armGeometry, armMaterial);
        rightArm.position.set(-0.4, 1.25, 0);
        rightArm.rotation.z = Math.PI/4;
        rightArm.castShadow = true;
        character.add(rightArm);
        
        // Legs
        const legGeometry = new THREE.CapsuleGeometry(0.08, 0.4, 4, 8);
        const legMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff }); // White socks
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(0.15, 0.2, 0);
        leftLeg.castShadow = true;
        character.add(leftLeg);
        
        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(-0.15, 0.2, 0);
        rightLeg.castShadow = true;
        character.add(rightLeg);
        
        // Shoes
        const shoeGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.2);
        const shoeMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 }); // Black shoes
        
        const leftShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
        leftShoe.position.set(0.15, 0, 0.05);
        leftShoe.castShadow = true;
        character.add(leftShoe);
        
        const rightShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
        rightShoe.position.set(-0.15, 0, 0.05);
        rightShoe.castShadow = true;
        character.add(rightShoe);
        
        // Add direction indicator for the doll (like a hair bow)
        const bowGeometry = new THREE.BoxGeometry(0.2, 0.1, 0.05);
        const bowMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red bow
        const bow = new THREE.Mesh(bowGeometry, bowMaterial);
        bow.position.set(0, 1.9, 0.15); // Position on top of head
        bow.castShadow = true;
        character.add(bow);
        
        // Add character to scene
        character.position.y = 0;
        character.rotation.y = Math.PI; // Face forward
        scene.add(character);
        console.log('Detailed doll character created using primitives');
    } catch (e) {
        console.error("Failed to create fallback character", e);
    }
    
    // Try to load a female doll character model
    try {
        console.log('Starting to load character model...');
        const loader = new THREE.GLTFLoader();
        
        // Try to load a female doll character from reliable source
        // Using a more reliable character model that's smaller and simpler
        loader.load('https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/SimpleSparseAccessor/glTF/SimpleSparseAccessor.gltf', (gltf) => {
            console.log('Model loaded, processing...');
            // Only remove the fallback character if we successfully loaded a new one
            scene.remove(character);
            
            character = gltf.scene;
            character.scale.set(0.5, 0.5, 0.5); // Scale to appropriate size
            character.position.y = 0;
            
            // Ensure all materials are visible
            character.traverse((node) => {
                if (node.isMesh) {
                    // Set pink doll-like material
                    if (node.material) {
                        node.material = new THREE.MeshStandardMaterial({ 
                            color: 0xff9ddb,
                            roughness: 0.3,
                            metalness: 0.2
                        });
                    }
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            
            scene.add(character);
            console.log('Character model loaded and processed successfully');
            
            // Setup character animations
            mixer = new THREE.AnimationMixer(character);
            const animations = gltf.animations;
            if (animations && animations.length > 0) {
                console.log('Found animations:', animations.length);
                // Try to find best matches for idle, walk, run
                const idleAnim = mixer.clipAction(animations.find(a => a.name.toLowerCase().includes('idle')) || animations[0]);
                const walkAnim = mixer.clipAction(animations.find(a => a.name.toLowerCase().includes('walk')) || 
                    animations.find(a => a.name.toLowerCase().includes('run')) || animations[0]);
                
                // Make sure animations exist before playing
                if (idleAnim) {
                    idleAnim.play();
                    currentAnimation = 'idle';
                    character.animations = { idle: idleAnim, walk: walkAnim };
                    console.log('Animations started successfully');
                } else {
                    console.log('No animations found to play');
                }
            }
        }, 
        // Progress callback
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
            // Update loading indicator
            const loadingDiv = document.getElementById('loading');
            if (loadingDiv) {
                loadingDiv.innerHTML = 'Loading character: ' + Math.floor(xhr.loaded / xhr.total * 100) + '%';
            }
        }, 
        (error) => {
            console.error('Error loading character model:', error);
            // We keep our fallback character that's already created
            console.log('Using existing fallback doll character');
        });
    } catch (e) {
        console.error('Exception during character loading setup:', e);
        // Fallback already exists
    }

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

    // Add furniture and decorations
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
    
    // Add door that touches the ground
    const doorFrame = new THREE.Mesh(
        new THREE.BoxGeometry(2.2, 7, 0.3),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 }) // Brown wood color
    );
    doorFrame.position.set(-6, 3.5, -9.8); // Lower position to touch ground
    scene.add(doorFrame);
    
    // Door panel
    const doorPanel = new THREE.Mesh(
        new THREE.BoxGeometry(1.8, 6.8, 0.15),
        new THREE.MeshStandardMaterial({ color: 0xA0522D }) // Sienna brown
    );
    doorPanel.position.set(-6, 3.4, -9.65);
    scene.add(doorPanel);
    
    // Door knob
    const doorKnob = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8, roughness: 0.2 }) // Gold color
    );
    doorKnob.position.set(-5.4, 3.4, -9.5);
    scene.add(doorKnob);
    
    // Add a small table
    const tableTop = new THREE.Mesh(
        new THREE.BoxGeometry(2, 0.1, 1),
        new THREE.MeshStandardMaterial({ color: 0x8B4513 }) // Brown wood
    );
    tableTop.position.set(5, 1.5, -8);
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    scene.add(tableTop);
    
    // Table legs
    for (let x = -0.8; x <= 0.8; x += 1.6) {
        for (let z = -0.4; z <= 0.4; z += 0.8) {
            const leg = new THREE.Mesh(
                new THREE.BoxGeometry(0.1, 1.5, 0.1),
                new THREE.MeshStandardMaterial({ color: 0x8B4513 })
            );
            leg.position.set(5 + x, 0.75, -8 + z);
            leg.castShadow = true;
            leg.receiveShadow = true;
            scene.add(leg);
        }
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
                velocity.y += 10; // More reasonable initial velocity
                canJump = false;
                
                // Add a small upward force over time for smoother jump
                let jumpForce = 0;
                const jumpInterval = setInterval(() => {
                    velocity.y += 2;
                    jumpForce += 2;
                    if (jumpForce >= 20) {
                        clearInterval(jumpInterval);
                    }
                }, 20);
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

// Add wall boundaries
const ROOM_SIZE = 9.7; // Slightly less than 10 to avoid clipping

// Check if position is within room boundaries
function checkBoundaries(position) {
    position.x = Math.max(-ROOM_SIZE, Math.min(ROOM_SIZE, position.x));
    position.z = Math.max(-ROOM_SIZE, Math.min(ROOM_SIZE, position.z));
    return position;
}

function updateCharacterPosition() {
    const delta = clock.getDelta();
    
    // Print debug info to help troubleshoot
    if (scene && camera && renderer && !window.debugInfoPrinted) {
        console.log("Debug - Scene:", scene);
        console.log("Debug - Camera:", camera.position);
        console.log("Debug - Character:", character ? character.position : "not created");
        window.debugInfoPrinted = true;
    }
    
    if (character) {
        // Calculate movement direction based on camera angle
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveLeft) - Number(moveRight);
        direction.y = 0;
        let isMoving = false;
        
        // Handle movement regardless of pointer lock
        if (direction.length() > 0) {
            direction.normalize();
            isMoving = true;
            // Calculate movement based on camera angle
            const moveSpeed = 0.12;
            const moveVector = new THREE.Vector3();
            
            // Use a default angle if cameraAngle is not defined
            const angle = (typeof cameraAngle !== 'undefined') ? cameraAngle : 0;
            
            moveVector.x = direction.x * Math.cos(angle) + direction.z * Math.sin(angle);
            moveVector.z = direction.z * Math.cos(angle) - direction.x * Math.sin(angle);
            
            // Calculate new position with wall collision detection
            const newPosition = new THREE.Vector3(
                character.position.x + moveVector.x * moveSpeed,
                character.position.y,
                character.position.z + moveVector.z * moveSpeed
            );
            
            // Check boundaries before applying movement
            const boundedPosition = checkBoundaries(newPosition);
            character.position.x = boundedPosition.x;
            character.position.z = boundedPosition.z;
            
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
        } else {
            // Simple animation for our fallback doll character
            if (isMoving) {
                // Simple bobbing motion for walking
                const walkBobHeight = Math.sin(Date.now() * 0.01) * 0.05;
                
                // Find and animate the dress part of our doll if it exists
                character.children.forEach(part => {
                    // Simple arm swinging for walking
                    if (part.geometry && part.geometry.type.includes('CapsuleGeometry') && 
                        (part.position.x > 0.3 || part.position.x < -0.3)) {
                        // These are likely the arms
                        const swingAngle = Math.sin(Date.now() * 0.005) * 0.5;
                        if (part.position.x > 0) {
                            part.rotation.z = -Math.PI/4 + swingAngle;
                        } else {
                            part.rotation.z = Math.PI/4 - swingAngle;
                        }
                    }
                });
                
                // Add a small bounce to the character
                character.position.y = Math.max(0, character.position.y + walkBobHeight);
            }
        }
        // Apply gravity and jumping with improved physics
        velocity.y -= 25 * delta; // Slightly stronger gravity
        character.position.y += velocity.y * delta;
        
        // Check if character is on the ground
        if (character.position.y < 0) {
            velocity.y = 0;
            character.position.y = 0;
            canJump = true;
        }
        
        // Smoother jump animation
        if (!canJump && velocity.y > 0) {
            // During upward jump phase
            if (character.animations && character.animations.jump) {
                if (currentAnimation !== 'jump') {
                    const jumpAnim = character.animations.jump;
                    const currentAnim = character.animations[currentAnimation];
                    if (currentAnim) currentAnim.crossFadeTo(jumpAnim, 0.1, true);
                    jumpAnim.play();
                    currentAnimation = 'jump';
                }
            }
        }
        // Update camera position based on character and mouse movement
        const cameraDistance = 5;
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
    try {
        updateCharacterPosition();
        renderer.render(scene, camera);
    } catch (e) {
        console.error("Error in animation loop:", e);
    }
}

// Make sure Three.js is properly loaded before initializing
if (typeof THREE === 'undefined') {
    console.error("THREE is not defined. Make sure Three.js is properly loaded.");
    alert("Three.js library not loaded correctly. Please check your internet connection and try reloading the page.");
} else {
    try {
        init();
        // Force a render to ensure something is visible
        renderer.render(scene, camera);
        animate();
        console.log("Animation started successfully");
    } catch (e) {
        console.error("Error during initialization:", e);
        alert("There was an error initializing the 3D scene. Check console for details.");
    }
}
