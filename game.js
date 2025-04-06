let scene, camera, renderer, character, mixer, clock, controls;
const interactiveObjects = [];
const TEXTURE_PATH = 'textures/';
const MOVEMENT_SPEED = 0.15;
const ROTATION_SPEED = 0.05;

class Game {
    constructor() {
        this.init();
        this.loadAssets();
        this.setupEventListeners();
    }

    init() {
        // Scene setup
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x8fbcd4);

        // Camera setup
        camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        camera.position.set(0, 5, 8);

        // Renderer configuration
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(renderer.domElement);

        // Lighting setup
        this.setupLighting();
        
        // Clock for animations
        clock = new THREE.Clock();

        // Initialize room
        this.createRoom();
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);

        // Window light
        const windowLight = new THREE.PointLight(0xfff3c2, 1.5, 15);
        windowLight.position.set(0, 3, -9.5);
        scene.add(windowLight);
    }

    async loadAssets() {
        try {
            // Load textures
            const textureLoader = new THREE.TextureLoader();
            const woodTexture = await textureLoader.loadAsync(`${TEXTURE_PATH}wood_floor.jpg`);
            woodTexture.wrapS = THREE.RepeatWrapping;
            woodTexture.wrapT = THREE.RepeatWrapping;
            woodTexture.repeat.set(4, 4);

            // Update floor material
            scene.children.find(obj => obj.type === 'Mesh').material.map = woodTexture;

            // Load character
            await this.createCharacter();
            
            // Final setup
            this.setupControls();
            this.animate();
        } catch(error) {
            console.error('Error loading assets:', error);
        }
    }

    createRoom() {
        // Floor
        const floorGeometry = new THREE.PlaneGeometry(20, 20);
        const floorMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xdeb887,
            side: THREE.DoubleSide
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);

        // Walls
        const wallMaterial = new THREE.MeshPhongMaterial({ color: 0xfff3c2 });
        const walls = [
            { position: [0, 4, -10], size: [20, 8, 0.2] }, // Back wall
            { position: [-10, 4, 0], size: [0.2, 8, 20], rotation: [0, Math.PI/2, 0] },
            { position: [10, 4, 0], size: [0.2, 8, 20], rotation: [0, -Math.PI/2, 0] }
        ];

        walls.forEach(wallConfig => {
            const wallGeometry = new THREE.BoxGeometry(...wallConfig.size);
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            wall.position.set(...wallConfig.position);
            if(wallConfig.rotation) wall.rotation.set(...wallConfig.rotation);
            wall.receiveShadow = true;
            scene.add(wall);
        });

        // Furniture
        this.createFurniture();
    }

    createFurniture() {
        // Bed
        const bed = this.createBed();
        bed.position.set(-6, 0, -8);
        scene.add(bed);
        interactiveObjects.push(bed);

        // Study Table
        const studyTable = this.createStudyTable();
        studyTable.position.set(5, 0, -8);
        scene.add(studyTable);
        interactiveObjects.push(studyTable);

        // Window
        const window = this.createWindow();
        window.position.set(0, 3, -9.9);
        scene.add(window);
    }

    createBed() {
        const bedGroup = new THREE.Group();
        const mainMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xb6e3d6,
            shininess: 30
        });

        // Bed frame
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1.2, 3),
            mainMaterial
        );
        frame.castShadow = true;
        bedGroup.add(frame);

        // Mattress
        const mattress = new THREE.Mesh(
            new THREE.BoxGeometry(3.8, 0.4, 2.8),
            new THREE.MeshPhongMaterial({ color: 0xffa69e })
        );
        mattress.position.y = 0.6;
        mattress.receiveShadow = true;
        bedGroup.add(mattress);

        // Pillows
        const pillowGeometry = new THREE.BoxGeometry(1.2, 0.3, 1);
        const pillowMaterial = new THREE.MeshPhongMaterial({ color: 0xffd700 });
        
        const pillow1 = new THREE.Mesh(pillowGeometry, pillowMaterial);
        pillow1.position.set(1.2, 0.9, 0);
        bedGroup.add(pillow1);

        const pillow2 = new THREE.Mesh(pillowGeometry, pillowMaterial);
        pillow2.position.set(-1.2, 0.9, 0);
        bedGroup.add(pillow2);

        return bedGroup;
    }

    async createCharacter() {
        const characterGroup = new THREE.Group();
        
        // Body
        const bodyGeometry = new THREE.CylinderGeometry(0.7, 0.7, 1.6, 8);
        const bodyMaterial = new THREE.MeshToonMaterial({
            color: 0xff69b4,
            gradientMap: await new THREE.TextureLoader().loadAsync(`${TEXTURE_PATH}toon_gradient.png`)
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 1.5;
        body.castShadow = true;
        characterGroup.add(body);

        // Head and facial features
        this.createHead(characterGroup);

        // Legs
        const legMaterial = new THREE.MeshToonMaterial({ color: 0x4b0082 });
        const legGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1.2);
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(0.4, 0.4, 0);
        characterGroup.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(-0.4, 0.4, 0);
        characterGroup.add(rightLeg);

        // Initial position
        character = characterGroup;
        character.position.set(0, 1, 0);
        scene.add(character);

        // Animation mixer
        mixer = new THREE.AnimationMixer(character);
    }

    createHead(parentGroup) {
        const headGroup = new THREE.Group();
        
        // Head base
        const headGeometry = new THREE.SphereGeometry(0.8);
        const headMaterial = new THREE.MeshToonMaterial({ color: 0xffddaa });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 2.5;
        head.castShadow = true;
        headGroup.add(head);

        // Hair
        const hairGeometry = new THREE.SphereGeometry(0.85, 32, 32);
        const hairMaterial = new THREE.MeshPhongMaterial({
            color: 0x8b4513,
            transparent: true,
            opacity: 0.8
        });
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.y = 0.1;
        headGroup.add(hair);

        // Eyes
        const eyeGeometry = new THREE.SphereGeometry(0.1);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.3, 0.2, 0.7);
        headGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.3, 0.2, 0.7);
        headGroup.add(rightEye);

        // Blush
        const blushGeometry = new THREE.SphereGeometry(0.15, 16, 16);
        const blushMaterial = new THREE.MeshPhongMaterial({ color: 0xff69b4 });
        
        const leftBlush = new THREE.Mesh(blushGeometry, blushMaterial);
        leftBlush.position.set(0.6, -0.1, 0.5);
        headGroup.add(leftBlush);

        const rightBlush = new THREE.Mesh(blushGeometry, blushMaterial);
        rightBlush.position.set(-0.6, -0.1, 0.5);
        headGroup.add(rightBlush);

        parentGroup.add(headGroup);
    }

    setupControls() {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target = character.position;
        controls.enablePan = false;
        controls.enableZoom = true;
        controls.minDistance = 5;
        controls.maxDistance = 12;
        controls.minPolarAngle = Math.PI/4;
        controls.maxPolarAngle = Math.PI/2;
    }

    setupEventListeners() {
        window.addEventListener('resize', this.onWindowResize);
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('click', this.onMouseClick);
    }

    onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onKeyDown = (event) => {
        const delta = clock.getDelta();
        const direction = new THREE.Vector3();

        camera.getWorldDirection(direction);
        direction.y = 0;
        direction.normalize();

        switch(event.key.toLowerCase()) {
            case 'w':
                character.position.add(direction.multiplyScalar(MOVEMENT_SPEED));
                break;
            case 's':
                character.position.add(direction.multiplyScalar(-MOVEMENT_SPEED));
                break;
            case 'a':
                character.rotation.y += ROTATION_SPEED;
                break;
            case 'd':
                character.rotation.y -= ROTATION_SPEED;
                break;
        }

        controls.target.copy(character.position);
    }

    onMouseMove = (event) => {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveObjects);

        const tooltip = document.getElementById('interaction-tooltip');
        if(intersects.length > 0) {
            const obj = intersects[0].object;
            tooltip.style.display = 'block';
            tooltip.textContent = `Click to interact with ${obj.name || 'object'}`;
        } else {
            tooltip.style.display = 'none';
        }
    }

    onMouseClick = (event) => {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2(
            (event.clientX / window.innerWidth) * 2 - 1,
            -(event.clientY / window.innerHeight) * 2 + 1
        );

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveObjects);

        if(intersects.length > 0) {
            const obj = intersects[0].object;
            this.handleInteraction(obj);
        }
    }

    handleInteraction(obj) {
        // Example interaction logic
        if(obj.parent.name === 'bed') {
            alert('You clicked the bed! Time to sleep?');
        } else if(obj.parent.name === 'study_table') {
            alert('Time to do homework!');
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = clock.getDelta();

        if(mixer) mixer.update(delta);
        controls.update();
        renderer.render(scene, camera);
    }
}

// Start the game
new Game();
