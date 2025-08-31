let scene, camera, renderer, character, mixer;
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let canJump = true;
let velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const clock = new THREE.Clock();

// Initialize the scene
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);

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
    // Floor
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x808080,
        roughness: 0.8 
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xe0e0e0,
        roughness: 0.5 
    });

    // Back wall
    const backWall = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 10),
        wallMaterial
    );
    backWall.position.z = -10;
    backWall.position.y = 5;
    scene.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 10),
        wallMaterial
    );
    leftWall.position.x = -10;
    leftWall.position.y = 5;
    leftWall.rotation.y = Math.PI / 2;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 10),
        wallMaterial
    );
    rightWall.position.x = 10;
    rightWall.position.y = 5;
    rightWall.rotation.y = -Math.PI / 2;
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
    
    if (character) {
        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize();

        if (moveForward || moveBackward || moveLeft || moveRight) {
            character.position.x += direction.x * 0.1;
            character.position.z += direction.z * 0.1;

            if (direction.x !== 0 || direction.z !== 0) {
                const angle = Math.atan2(direction.x, direction.z);
                character.rotation.y = angle;
            }
        }

        // Apply gravity
        velocity.y -= 9.8 * delta;
        character.position.y += velocity.y * delta;

        // Ground check
        if (character.position.y < 0) {
            velocity.y = 0;
            character.position.y = 0;
            canJump = true;
        }

        // Update camera to follow character
        camera.position.x = character.position.x;
        camera.position.z = character.position.z + 5;
        camera.lookAt(character.position);
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
