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

    // Enhanced lighting to ensure maximum visibility
    // Stronger ambient light for better overall visibility
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9); // Brighter ambient
    scene.add(ambientLight);

    // Main directional light (like the sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Higher intensity
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    // Increase shadow map size for better quality
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);
    
    // Additional lights to ensure character is well-lit from multiple angles
    const frontLight = new THREE.PointLight(0xffffee, 1.0); // Slightly warm light
    frontLight.position.set(0, 3, 5); // In front of character
    scene.add(frontLight);
    
    const backLight = new THREE.PointLight(0xeeeeff, 0.7); // Slightly cool back light
    backLight.position.set(0, 4, -4); // Behind character
    scene.add(backLight);

    // Create room
    createRoom();

    // Create a SUPER visible fallback character first (to ensure something is visible)
    const fallbackGeometry = new THREE.BoxGeometry(1, 2, 1);
    const fallbackMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff }); // Bright pink
    const fallbackCharacter = new THREE.Mesh(fallbackGeometry, fallbackMaterial);
    fallbackCharacter.position.set(0, 1, 0); // Position at center
    scene.add(fallbackCharacter);
    console.log("Added bright fallback character for visibility");
    
    // Create a Vanellope von Schweetz character using primitive shapes
    try {
        // Create a 3D Vanellope character
        character = new THREE.Group();
        
        // Head with more detail (better sphere resolution) and enhanced visibility
        const headGeometry = new THREE.SphereGeometry(0.25, 24, 24);
        const headMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffdbac, // Skin tone
            roughness: 0.5,
            metalness: 0.1,
            emissive: 0x221100, // Slight emissive color for better visibility
            emissiveIntensity: 0.2
        }); 
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.65;
        head.castShadow = true;
        head.receiveShadow = true;
        character.add(head);
        
        // Black ponytail hairstyle
        const hairBaseGeometry = new THREE.SphereGeometry(0.27, 24, 24, 0, Math.PI * 2, 0, Math.PI / 1.8);
        const hairMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x151515, // Black hair like Vanellope's
            roughness: 0.5,
            metalness: 0.1
        }); 
        const hairBase = new THREE.Mesh(hairBaseGeometry, hairMaterial);
        hairBase.position.y = 1.7;
        hairBase.castShadow = true;
        character.add(hairBase);
        
        // Ponytail
        const ponytailGeometry = new THREE.CylinderGeometry(0.15, 0.05, 0.6, 16);
        const ponytail = new THREE.Mesh(ponytailGeometry, hairMaterial);
        ponytail.position.set(0, 1.75, -0.15);
        ponytail.rotation.x = -Math.PI/6;
        ponytail.castShadow = true;
        character.add(ponytail);
        
        // Candy decorations in hair
        const candyColors = [0xff3366, 0x66ff33, 0x3366ff, 0xffcc00];
        for (let i = 0; i < 5; i++) {
            const candyGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const candyMaterial = new THREE.MeshStandardMaterial({
                color: candyColors[i % candyColors.length],
                roughness: 0.3,
                metalness: 0.8
            });
            const candy = new THREE.Mesh(candyGeometry, candyMaterial);
            
            // Position candies around the hair
            const angle = i * Math.PI / 3;
            candy.position.set(
                Math.sin(angle) * 0.2,
                1.85 + (i % 2) * 0.07,
                Math.cos(angle) * 0.2
            );
            candy.castShadow = true;
            character.add(candy);
        }
        
        // Big expressive eyes (Vanellope has large eyes)
        const eyeGeometry = new THREE.SphereGeometry(0.06, 16, 16);
        const eyeWhiteMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff }); // White part
        
        // Left eye white
        const leftEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
        leftEyeWhite.position.set(0.12, 1.7, 0.21);
        leftEyeWhite.scale.set(1.2, 1, 0.5);
        character.add(leftEyeWhite);
        
        // Right eye white
        const rightEyeWhite = new THREE.Mesh(eyeGeometry, eyeWhiteMaterial);
        rightEyeWhite.position.set(-0.12, 1.7, 0.21);
        rightEyeWhite.scale.set(1.2, 1, 0.5);
        character.add(rightEyeWhite);
        
        // Eye pupils (hazel/brown color for Vanellope)
        const pupilGeometry = new THREE.SphereGeometry(0.03, 12, 12);
        const pupilMaterial = new THREE.MeshBasicMaterial({ color: 0x553311 });
        
        // Left pupil
        const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        leftPupil.position.set(0.12, 1.7, 0.24);
        character.add(leftPupil);
        
        // Right pupil
        const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        rightPupil.position.set(-0.12, 1.7, 0.24);
        character.add(rightPupil);
        
        // Cute little nose
        const noseGeometry = new THREE.ConeGeometry(0.03, 0.05, 16);
        const noseMaterial = new THREE.MeshStandardMaterial({ color: 0xffcab6 });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.rotation.x = -Math.PI/2;
        nose.position.set(0, 1.65, 0.25);
        character.add(nose);
        
        // Smiling mouth
        const mouthGeometry = new THREE.TorusGeometry(0.06, 0.015, 8, 12, Math.PI);
        const mouthMaterial = new THREE.MeshBasicMaterial({ color: 0xcc3333 }); // Red lips
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, 1.58, 0.24);
        mouth.rotation.x = Math.PI/2 - Math.PI/8;
        character.add(mouth);
        
        // Mint green hoodie (Vanellope's signature look) - more vibrant for visibility
        const hoodieGeometry = new THREE.CapsuleGeometry(0.25, 0.5, 8, 16);
        const hoodieMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x00FFAA, // Brighter mint green for visibility
            roughness: 0.4,
            metalness: 0.2,
            emissive: 0x005533, // Slight emissive glow
            emissiveIntensity: 0.3
        });
        const hoodie = new THREE.Mesh(hoodieGeometry, hoodieMaterial);
        hoodie.position.y = 1.3;
        hoodie.scale.set(1, 0.8, 0.6);
        hoodie.castShadow = true;
        hoodie.receiveShadow = true;
        character.add(hoodie);
        
        // Hoodie strings
        const stringGeometry = new THREE.CylinderGeometry(0.01, 0.01, 0.2, 6);
        const stringMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        
        const leftString = new THREE.Mesh(stringGeometry, stringMaterial);
        leftString.position.set(0.1, 1.2, 0.2);
        leftString.rotation.x = Math.PI/6;
        character.add(leftString);
        
        const rightString = new THREE.Mesh(stringGeometry, stringMaterial);
        rightString.position.set(-0.1, 1.2, 0.2);
        rightString.rotation.x = Math.PI/6;
        character.add(rightString);
        
        // Brown skirt (lower part)
        const skirtGeometry = new THREE.ConeGeometry(0.35, 0.5, 16);
        const skirtMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x8B4513, // Brown skirt
            roughness: 0.7,
            metalness: 0.1
        });
        const skirt = new THREE.Mesh(skirtGeometry, skirtMaterial);
        skirt.position.y = 0.9;
        skirt.castShadow = true;
        character.add(skirt);
        
        // Arms with mint sleeves
        const armGeometry = new THREE.CapsuleGeometry(0.07, 0.45, 8, 16);
        
        // Left arm
        const leftArmMaterial = new THREE.MeshStandardMaterial({ color: 0x66CDAA }); // Match hoodie
        const leftArm = new THREE.Mesh(armGeometry, leftArmMaterial);
        leftArm.position.set(0.35, 1.3, 0);
        leftArm.rotation.z = -Math.PI/6;
        leftArm.castShadow = true;
        character.add(leftArm);
        
        // Left hand
        const leftHandGeometry = new THREE.SphereGeometry(0.07, 16, 16);
        const handMaterial = new THREE.MeshStandardMaterial({ color: 0xffdbac }); // Skin tone
        const leftHand = new THREE.Mesh(leftHandGeometry, handMaterial);
        leftHand.position.set(0.45, 1.1, 0);
        leftHand.scale.set(1, 0.7, 0.7);
        character.add(leftHand);
        
        // Right arm
        const rightArmMaterial = new THREE.MeshStandardMaterial({ color: 0x66CDAA }); // Match hoodie
        const rightArm = new THREE.Mesh(armGeometry, rightArmMaterial);
        rightArm.position.set(-0.35, 1.3, 0);
        rightArm.rotation.z = Math.PI/6;
        rightArm.castShadow = true;
        character.add(rightArm);
        
        // Right hand
        const rightHand = new THREE.Mesh(leftHandGeometry.clone(), handMaterial);
        rightHand.position.set(-0.45, 1.1, 0);
        rightHand.scale.set(1, 0.7, 0.7);
        character.add(rightHand);
        
        // Mismatched stockings - Vanellope's iconic look
        const legGeometry = new THREE.CapsuleGeometry(0.07, 0.5, 8, 16);
        
        // Left leg - green and white stripes
        const leftLegMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xAAFF99, // Light green
            roughness: 0.5
        }); 
        const leftLeg = new THREE.Mesh(legGeometry, leftLegMaterial);
        leftLeg.position.set(0.15, 0.5, 0);
        leftLeg.castShadow = true;
        character.add(leftLeg);
        
        // Add stripes to left leg
        for (let i = 0; i < 4; i++) {
            const stripeGeometry = new THREE.TorusGeometry(0.08, 0.02, 8, 16, Math.PI * 2);
            const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe.position.set(0.15, 0.35 + i * 0.15, 0);
            stripe.rotation.x = Math.PI/2;
            stripe.scale.set(1, 1, 0.1);
            character.add(stripe);
        }
        
        // Right leg - pink and white stripes
        const rightLegMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xFF99AA, // Light pink
            roughness: 0.5
        }); 
        const rightLeg = new THREE.Mesh(legGeometry, rightLegMaterial);
        rightLeg.position.set(-0.15, 0.5, 0);
        rightLeg.castShadow = true;
        character.add(rightLeg);
        
        // Add stripes to right leg
        for (let i = 0; i < 4; i++) {
            const stripeGeometry = new THREE.TorusGeometry(0.08, 0.02, 8, 16, Math.PI * 2);
            const stripeMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
            const stripe = new THREE.Mesh(stripeGeometry, stripeMaterial);
            stripe.position.set(-0.15, 0.35 + i * 0.15, 0);
            stripe.rotation.x = Math.PI/2;
            stripe.scale.set(1, 1, 0.1);
            character.add(stripe);
        }
        
        // Black shoes with small mint details
        const shoeGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.22);
        const shoeMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x000000,
            roughness: 0.4,
            metalness: 0.3 
        }); 
        
        // Left shoe
        const leftShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
        leftShoe.position.set(0.15, 0.04, 0.05);
        leftShoe.castShadow = true;
        character.add(leftShoe);
        
        // Right shoe
        const rightShoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
        rightShoe.position.set(-0.15, 0.04, 0.05);
        rightShoe.castShadow = true;
        character.add(rightShoe);
        
        // Mint accent on shoes
        const shoeAccentGeometry = new THREE.BoxGeometry(0.06, 0.03, 0.05);
        const shoeAccentMaterial = new THREE.MeshStandardMaterial({ color: 0x66CDAA });
        
        const leftShoeAccent = new THREE.Mesh(shoeAccentGeometry, shoeAccentMaterial);
        leftShoeAccent.position.set(0.15, 0.08, 0.15);
        character.add(leftShoeAccent);
        
        const rightShoeAccent = new THREE.Mesh(shoeAccentGeometry, shoeAccentMaterial);
        rightShoeAccent.position.set(-0.15, 0.08, 0.15);
        character.add(rightShoeAccent);
        
        // Add character to scene with proper positioning - MUCH BIGGER for visibility
        character.position.y = 0;
        character.rotation.y = Math.PI; // Face forward
        character.scale.set(2.0, 2.0, 2.0); // Make character MUCH larger for better visibility
        
        // Ensure all meshes cast and receive shadows for better visibility
        character.traverse((node) => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
                // Make materials MUCH brighter for better visibility
                if (node.material) {
                    // Make materials super bright
                    node.material.emissive = new THREE.Color(0x444444);
                    node.material.emissiveIntensity = 0.5;
                    
                    // Increase material brightness
                    if (node.material.color) {
                        const color = node.material.color.clone();
                        // Brighten the color
                        color.r = Math.min(1, color.r * 1.3);
                        color.g = Math.min(1, color.g * 1.3);
                        color.b = Math.min(1, color.b * 1.3);
                        node.material.color = color;
                    }
                }
            }
        });
        
        // Add character to scene and make sure it's visible
        scene.add(character);
        
        // Log character creation
        console.log('Simplified Vanellope character created and added to scene:', character);
        
        // Force multiple immediate renders to check visibility
        if (renderer) {
            // Remove the fallback character now that Vanellope is created
            scene.children.forEach(child => {
                if (child.isMesh && child.geometry && child.geometry.type === 'BoxGeometry' && 
                    child.material && child.material.color && 
                    child.material.color.getHex() === 0xff00ff) {
                    scene.remove(child);
                    console.log("Removed fallback character");
                }
            });
            
            renderer.render(scene, camera);
            
            // Add a small delay and render again to ensure visibility
            setTimeout(() => {
                renderer.render(scene, camera);
                console.log("Second render completed to ensure visibility");
            }, 100);
        }
    } catch (e) {
        console.error("Failed to create fallback character", e);
    }
    
    // Using our custom Vanellope model with simplified animations
    console.log('Using custom Vanellope von Schweetz character model');
    
    // Add multiple spotlights directly on the character for maximum visibility
    const characterSpotlight1 = new THREE.SpotLight(0xffffff, 2.0);
    characterSpotlight1.position.set(0, 5, 3);
    characterSpotlight1.target = character;
    characterSpotlight1.angle = Math.PI/4;  // Wider angle
    characterSpotlight1.penumbra = 0.2;
    characterSpotlight1.castShadow = true;
    characterSpotlight1.distance = 20;  // Longer reach
    scene.add(characterSpotlight1);
    
    // Add a second spotlight from another angle
    const characterSpotlight2 = new THREE.SpotLight(0xffffaa, 1.5);  // Slightly warm light
    characterSpotlight2.position.set(3, 4, -2);  // From side/back
    characterSpotlight2.target = character;
    characterSpotlight2.angle = Math.PI/4;
    characterSpotlight2.penumbra = 0.2;
    characterSpotlight2.castShadow = true;
    scene.add(characterSpotlight2);
    
    // Add very bright point light directly on character
    const characterPointLight = new THREE.PointLight(0xffffff, 2.0);
    characterPointLight.position.set(0, 1.5, 0);  // Right in the middle of the character
    characterPointLight.distance = 3;  // Short distance - just to light up the character
    characterPointLight.decay = 1;  // Slower decay
    scene.add(characterPointLight);
    
    // Hide loading indicator since we're using our custom model
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.innerHTML = 'Vanellope is ready to race!';
        setTimeout(() => {
            loadingDiv.style.display = 'none';
        }, 2000);
    }

    // Position camera even closer and at a better angle for character visibility
    camera.position.set(0, 2, 3); // Closer to character
    camera.lookAt(0, 1, 0); // Look directly at character
    cameraHeight = 2;
    
    // Set character in a well-lit position and make sure it's visible
    character.position.set(0, 0, 0);
    
    // Force multiple renders to ensure character is displayed
    renderer.render(scene, camera);
    
    // Add debug info
    console.log("Camera positioned to view character:", camera.position);
    console.log("Character position:", character.position);
    console.log("Character rotation:", character.rotation);
    
    // Display character position in debug element
    const debugDiv = document.getElementById('debug');
    if (debugDiv) {
        debugDiv.innerHTML = 'Character should be visible at position (0,0,0)';
        debugDiv.style.fontSize = '16px';
        debugDiv.style.padding = '10px';
    }

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
            // Simplified Vanellope animations - just walking, no glitching
            
            if (isMoving) {
                // Simple bouncy walking motion
                const walkBobHeight = Math.sin(Date.now() * 0.01) * 0.05;
                
                // Animate arms and legs with simple movements
                character.children.forEach(part => {
                    // Arm swinging - mint green sleeves
                    if (part.geometry && part.geometry.type.includes('CapsuleGeometry') && 
                        (part.position.x > 0.3 || part.position.x < -0.3) &&
                        part.position.y > 1) {
                        // These are the arms
                        const swingAngle = Math.sin(Date.now() * 0.008) * 0.4;
                        if (part.position.x > 0) {
                            part.rotation.z = -Math.PI/6 + swingAngle;
                        } else {
                            part.rotation.z = Math.PI/6 - swingAngle;
                        }
                    }
                    
                    // Leg swinging - mismatched stockings
                    if (part.geometry && part.geometry.type.includes('CapsuleGeometry') && 
                        (part.position.x > 0.1 || part.position.x < -0.1) &&
                        part.position.y < 1) {
                        // These are the legs
                        const legSwing = Math.sin(Date.now() * 0.01) * 0.3;
                        if (part.position.x > 0) {
                            part.rotation.x = legSwing;
                        } else {
                            part.rotation.x = -legSwing;
                        }
                    }
                    
                    // Make ponytail bounce
                    if (part.geometry && part.geometry.type.includes('Cylinder') && 
                        part.position.z < 0) {
                        // This is the ponytail
                        part.rotation.x = -Math.PI/6 + Math.sin(Date.now() * 0.01) * 0.1;
                    }
                });
                
                // Bounce effect for walking
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
        // Update camera position based on character and mouse movement - closer camera
        const cameraDistance = 3.5; // Closer camera
        camera.position.x = character.position.x - Math.sin(cameraAngle) * cameraDistance;
        camera.position.z = character.position.z - Math.cos(cameraAngle) * cameraDistance;
        camera.position.y = character.position.y + cameraHeight;
        camera.lookAt(
            character.position.x,
            character.position.y + 1.0, // Look directly at character's center
            character.position.z
        );
        
        // Keep checking if character is visible
        if (!window.characterVisibilityChecked && Date.now() > 5000) {
            console.log("Character visibility check:", {
                "Position": character.position,
                "Is in scene": scene.children.includes(character),
                "Scale": character.scale,
                "Camera position": camera.position,
                "Camera target": new THREE.Vector3(character.position.x, character.position.y + 1.0, character.position.z)
            });
            window.characterVisibilityChecked = true;
        }
    }
    if (mixer) {
        mixer.update(delta);
    }
}


function animate() {
    requestAnimationFrame(animate);
    try {
        updateCharacterPosition();
        
        // Every 60 frames (about 1 second), check if character is still visible
        if (frameCount % 60 === 0) {
            // Log character position
            if (character) {
                console.log("Character position:", character.position);
            }
        }
        
        renderer.render(scene, camera);
        frameCount++;
    } catch (e) {
        console.error("Error in animation loop:", e);
    }
}

// Add frame counter
let frameCount = 0;

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
