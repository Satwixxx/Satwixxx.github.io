let scene, camera, renderer, character, controls, raycaster, mixer, clock;
const interactiveObjects = [];
const MOVEMENT_SPEED = 0.15;
const ROTATION_SPEED = 0.05;

class Game {
    constructor() {
        this.init();
        this.createScene();
        this.createCharacter();
        this.createRoom();
        this.setupControls();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        // Core setup
        scene = new THREE.Scene();
        clock = new THREE.Clock();
        raycaster = new THREE.Raycaster();

        // Camera
        camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        camera.position.set(0, 5, 8);

        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        document.body.appendChild(renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
    }

    createScene() {
        // Floor with procedural texture
        const floorTexture = this.createWoodTexture();
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.MeshPhongMaterial({ map: floorTexture })
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);
    }

    createWoodTexture() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 512;
        
        // Wood grain pattern
        ctx.fillStyle = '#deb887';
        ctx.fillRect(0, 0, 512, 512);
        ctx.strokeStyle = '#a0522d55';
        for(let i = 0; i < 512; i += 16) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 512);
            ctx.stroke();
        }
        
        return new THREE.CanvasTexture(canvas);
    }

    createCharacter() {
        const group = new THREE.Group();
        
        // Body with gradient
        const bodyTexture = this.createBodyTexture();
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.7, 0.7, 1.6, 8),
            new THREE.MeshPhongMaterial({ map: bodyTexture })
        );
        body.position.y = 1.5;
        body.castShadow = true;
        group.add(body);

        // Head components
        this.createHead(group);

        // Animation mixer
        mixer = new THREE.AnimationMixer(group);
        
        character = group;
        scene.add(character);
    }

    createBodyTexture() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 256;
        const gradient = ctx.createLinearGradient(0, 0, 256, 256);
        gradient.addColorStop(0, '#ff69b4');
        gradient.addColorStop(1, '#ff1493');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 256, 256);
        return new THREE.CanvasTexture(canvas);
    }

    createHead(parent) {
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.8),
            new THREE.MeshPhongMaterial({ color: 0xffddaa })
        );
        head.position.y = 2.5;
        head.castShadow = true;

        // Facial features
        const eyeGeometry = new THREE.SphereGeometry(0.1);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.3, 2.7, 0.7);
        head.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.3, 2.7, 0.7);
        head.add(rightEye);

        parent.add(head);
    }

    createRoom() {
        // Walls
        const wallMaterial = new THREE.MeshPhongMaterial({ color: 0xfff3c2 });
        const walls = [
            this.createWall(20, 8, 0.2, [0, 4, -10]),
            this.createWall(0.2, 8, 20, [-10, 4, 0]),
            this.createWall(0.2, 8, 20, [10, 4, 0])
        ];
        walls.forEach(wall => scene.add(wall));

        // Furniture
        this.createFurniture();
    }

    createWall(w, h, d, pos) {
        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            new THREE.MeshPhongMaterial({ color: 0xfff3c2 })
        );
        wall.position.set(...pos);
        wall.receiveShadow = true;
        return wall;
    }

    createFurniture() {
        // Bed
        const bed = this.createBed();
        bed.position.set(-6, 0, -8);
        scene.add(bed);
        interactiveObjects.push(bed);

        // Study Table
        const table = this.createStudyTable();
        table.position.set(5, 0, -8);
        scene.add(table);
        interactiveObjects.push(table);
    }

    createBed() {
        const bed = new THREE.Group();
        const material = new THREE.MeshPhongMaterial({ color: 0xb6e3d6 });
        
        // Base
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1.2, 3),
            material
        );
        base.castShadow = true;
        bed.add(base);

        // Mattress
        const mattress = new THREE.Mesh(
            new THREE.BoxGeometry(3.8, 0.4, 2.8),
            new THREE.MeshPhongMaterial({ color: 0xffa69e })
        );
        mattress.position.y = 0.6;
        bed.add(mattress);

        return bed;
    }

    createStudyTable() {
        const table = new THREE.Group();
        const material = new THREE.MeshPhongMaterial({ color: 0xd4af37 });
        
        // Table top
        const top = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.2, 2),
            material
        );
        top.position.y = 1;
        table.add(top);

        // Legs
        const legGeometry = new THREE.BoxGeometry(0.3, 2, 0.3);
        const legs = [
            new THREE.Mesh(legGeometry, material).position.set(1.2, 0, 0.8),
            new THREE.Mesh(legGeometry, material).position.set(-1.2, 0, 0.8),
            new THREE.Mesh(legGeometry, material).position.set(1.2, 0, -0.8),
            new THREE.Mesh(legGeometry, material).position.set(-1.2, 0, -0.8)
        ];
        legs.forEach(leg => table.add(leg));

        return table;
    }

    setupControls() {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target = character.position;
        controls.enablePan = false;
        controls.minDistance = 5;
        controls.maxDistance = 10;
        controls.minPolarAngle = Math.PI/4;
        controls.maxPolarAngle = Math.PI/2;
    }

    setupEventListeners() {
        window.addEventListener('resize', this.onWindowResize);
        document.addEventListener('keydown', this.onKeyDown);
        document.addEventListener('mousemove', this.onMouseMove);
        document.addEventListener('click', this.onMouseClick);
    }

    onWindowResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onKeyDown = (e) => {
        const delta = clock.getDelta();
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        direction.y = 0;

        switch(e.key.toLowerCase()) {
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

    onMouseMove = (e) => {
        const mouse = new THREE.Vector2(
            (e.clientX / window.innerWidth) * 2 - 1,
            -(e.clientY / window.innerHeight) * 2 + 1
        );

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveObjects);

        const tooltip = document.getElementById('interaction-tooltip');
        if(intersects.length > 0) {
            tooltip.style.display = 'block';
            tooltip.textContent = `Interact with ${intersects[0].object.parent.type}`;
        } else {
            tooltip.style.display = 'none';
        }
    }

    onMouseClick = (e) => {
        const mouse = new THREE.Vector2(
            (e.clientX / window.innerWidth) * 2 - 1,
            -(e.clientY / window.innerHeight) * 2 + 1
        );

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(interactiveObjects);

        if(intersects.length > 0) {
            alert(`You interacted with the ${intersects[0].object.parent.type}!`);
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

// Initialize game
new Game();
