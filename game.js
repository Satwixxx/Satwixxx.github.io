let scene, camera, renderer, character, controls, raycaster, mixer, clock;
const interactiveObjects = [];
const MOVEMENT = {
    speed: 0.2,
    acceleration: 0.1,
    deceleration: 0.15,
    maxSpeed: 0.8,
    currentSpeed: 0
};
const ROTATION_SPEED = 0.06;

class Game {
    constructor() {
        this.init();
        this.createScene();
        this.createVanellope();
        this.createEnhancedRoom();
        this.setupControls();
        this.setupEventListeners();
        this.animate();
    }

    init() {
        scene = new THREE.Scene();
        clock = new THREE.Clock();
        raycaster = new THREE.Raycaster();

        camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
        camera.position.set(0, 6, 10);
        camera.lookAt(0, 3, 0);

        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        document.body.appendChild(renderer.domElement);

        // Enhanced lighting
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambient);
        
        const directional = new THREE.DirectionalLight(0xffffff, 0.8);
        directional.position.set(5, 10, 7);
        directional.castShadow = true;
        scene.add(directional);
    }

    createScene() {
        // Floor with checkered rug
        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(20, 20),
            new THREE.MeshPhongMaterial({ 
                color: 0xdeb887,
                map: this.createCheckeredTexture()
            })
        );
        floor.rotation.x = -Math.PI/2;
        floor.receiveShadow = true;
        scene.add(floor);
    }

    createCheckeredTexture() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.height = 512;
        
        // Candy checkered pattern
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(0, 0, 512, 512);
        ctx.fillStyle = '#FF69B4';
        for(let y = 0; y < 512; y += 64) {
            for(let x = (y/64 % 2)*64; x < 512; x += 128) {
                ctx.fillRect(x, y, 64, 64);
            }
        }
        return new THREE.CanvasTexture(canvas);
    }

    createVanellope() {
        const group = new THREE.Group();
        
        // Body with hoodie
        const body = new THREE.Mesh(
            new THREE.CylinderGeometry(0.7, 0.7, 1.6, 8),
            new THREE.MeshPhongMaterial({ 
                color: 0xFF69B4,
                shininess: 100
            })
        );
        body.position.y = 1.5;
        body.castShadow = true;
        group.add(body);

        // Hood with candy stripes
        const hood = new THREE.Mesh(
            new THREE.SphereGeometry(0.9, 32, 32, 0, Math.PI),
            new THREE.MeshPhongMaterial({ 
                color: 0xFF1493,
                map: this.createCandyStripeTexture()
            })
        );
        hood.position.set(0, 2.8, 0.3);
        hood.rotation.x = -0.3;
        group.add(hood);

        // Head with glitch effect
        const head = new THREE.Mesh(
            new THREE.SphereGeometry(0.8),
            new THREE.MeshPhongMaterial({ 
                color: 0xFFE4B5,
                specular: 0xFFFFFF,
                shininess: 50
            })
        );
        head.position.y = 2.5;
        group.add(head);

        // Facial features
        this.createEyes(head);
        this.createMouth(head);

        // Hair (pigtails with ribbons)
        this.createHair(group);

        // Skirt with candy pattern
        const skirt = new THREE.Mesh(
            new THREE.ConeGeometry(1, 0.5, 8),
            new THREE.MeshPhongMaterial({
                map: this.createCandyPatternTexture()
            })
        );
        skirt.position.y = 1.1;
        skirt.rotation.x = Math.PI;
        group.add(skirt);

        // Legs with striped socks
        this.createLegs(group);

        character = group;
        scene.add(character);
        mixer = new THREE.AnimationMixer(group);
    }

    createCandyStripeTexture() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.height = 256;
        
        // Vertical stripes
        ctx.fillStyle = '#FFFFFF';
        for(let x = 0; x < 256; x += 32) {
            ctx.fillRect(x, 0, 16, 256);
        }
        return new THREE.CanvasTexture(canvas);
    }

    createCandyPatternTexture() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.height = 256;
        
        // Candy dots pattern
        ctx.fillStyle = '#FF69B4';
        ctx.fillRect(0, 0, 256, 256);
        ctx.fillStyle = '#FFD700';
        for(let y = 0; y < 256; y += 32) {
            for(let x = (y/32 % 2)*32; x < 256; x += 64) {
                ctx.beginPath();
                ctx.arc(x + 16, y + 16, 8, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        return new THREE.CanvasTexture(canvas);
    }

    createEyes(head) {
        const eyeGeometry = new THREE.SphereGeometry(0.15);
        const eyeMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        
        // Main eyes
        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(0.35, 2.65, 0.8);
        head.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(-0.35, 2.65, 0.8);
        head.add(rightEye);

        // Eye sparkles
        const sparkleGeo = new THREE.SphereGeometry(0.05);
        const sparkleMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
        const sparkles = [
            new THREE.Mesh(sparkleGeo, sparkleMat),
            new THREE.Mesh(sparkleGeo, sparkleMat)
        ];
        sparkles[0].position.set(0.25, 2.7, 0.85);
        sparkles[1].position.set(-0.25, 2.7, 0.85);
        sparkles.forEach(s => head.add(s));
    }

    createMouth(head) {
        const mouthGeo = new THREE.TorusGeometry(0.2, 0.05, 8, 32);
        const mouthMat = new THREE.MeshPhongMaterial({ color: 0xFF1493 });
        const mouth = new THREE.Mesh(mouthGeo, mouthMat);
        mouth.position.set(0, 2.4, 0.8);
        mouth.rotation.x = Math.PI/2;
        head.add(mouth);
    }

    createHair(group) {
        const hairMaterial = new THREE.MeshPhongMaterial({ color: 0x2F1B0A });
        
        // Pigtails with ribbons
        const createPigtail = (side) => {
            const pigtail = new THREE.Group();
            
            // Hair strands
            const hair = new THREE.Mesh(
                new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8),
                hairMaterial
            );
            hair.rotation.z = side * 0.5;
            
            // Ribbon
            const ribbon = new THREE.Mesh(
                new THREE.BoxGeometry(0.3, 0.1, 0.3),
                new THREE.MeshPhongMaterial({ color: 0xFF0000 })
            );
            ribbon.position.y = 0.6;
            
            pigtail.add(hair);
            pigtail.add(ribbon);
            pigtail.position.x = side * 0.6;
            pigtail.position.y = 3.2;
            return pigtail;
        };
        
        group.add(createPigtail(1));
        group.add(createPigtail(-1));
    }

    createLegs(group) {
        const legMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x4B0082,
            map: this.createStripeTexture()
        });
        
        const legGeometry = new THREE.CylinderGeometry(0.25, 0.15, 1.5);
        
        const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
        leftLeg.position.set(0.4, 0.4, 0);
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
        rightLeg.position.set(-0.4, 0.4, 0);
        group.add(rightLeg);
    }

    createStripeTexture() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.height = 256;
        
        // Horizontal stripes
        ctx.fillStyle = '#FFFFFF';
        for(let y = 0; y < 256; y += 32) {
            ctx.fillRect(0, y, 256, 16);
        }
        return new THREE.CanvasTexture(canvas);
    }

    createEnhancedRoom() {
        // Complete walls with front wall visibility
        const wallMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFF3C2,
            transparent: true,
            opacity: 0.3
        });
        
        const walls = [
            this.createWall(20, 8, 0.2, [0, 4, -10]),  // Back
            this.createWall(0.2, 8, 20, [-10, 4, 0]),  // Left
            this.createWall(0.2, 8, 20, [10, 4, 0]),   // Right
            this.createWall(20, 8, 0.2, [0, 4, 10])    // Front
        ];
        walls.forEach(wall => scene.add(wall));

        // Full furniture set
        this.createFurnitureCollection();
    }

    createWall(w, h, d, pos) {
        const wall = new THREE.Mesh(
            new THREE.BoxGeometry(w, h, d),
            new THREE.MeshPhongMaterial({ 
                color: 0xFFF3C2,
                transparent: true,
                opacity: pos[2] === 10 ? 0.3 : 1
            })
        );
        wall.position.set(...pos);
        wall.receiveShadow = true;
        return wall;
    }

    createFurnitureCollection() {
        // Queen bed with canopy
        const bed = this.createCanopyBed();
        bed.position.set(-7, 0, -8);
        scene.add(bed);
        interactiveObjects.push(bed);

        // Gaming desk
        const desk = this.createGamingDesk();
        desk.position.set(6, 0, -8);
        scene.add(desk);
        interactiveObjects.push(desk);

        // Wardrobe with mirror
        const wardrobe = this.createWardrobe();
        wardrobe.position.set(-9, 0, 5);
        scene.add(wardrobe);
        interactiveObjects.push(wardrobe);

        // Bookshelf with goodies
        const bookshelf = this.createBookshelf();
        bookshelf.position.set(8, 0, 5);
        scene.add(bookshelf);
        interactiveObjects.push(bookshelf);

        // Nightstand with lamp
        const nightstand = this.createNightstand();
        nightstand.position.set(-7, 0, 5);
        scene.add(nightstand);
        interactiveObjects.push(nightstand);
    }

    createCanopyBed() {
        const bed = new THREE.Group();
        const material = new THREE.MeshPhongMaterial({ color: 0xB6E3D6 });
        
        // Main frame
        const frame = new THREE.Mesh(
            new THREE.BoxGeometry(5, 1.5, 4),
            material
        );
        frame.castShadow = true;
        bed.add(frame);

        // Canopy posts
        const postGeo = new THREE.CylinderGeometry(0.2, 0.2, 4);
        const posts = [
            new THREE.Mesh(postGeo, material).position.set(-2.3, 2, -1.8),
            new THREE.Mesh(postGeo, material).position.set(2.3, 2, -1.8),
            new THREE.Mesh(postGeo, material).position.set(-2.3, 2, 1.8),
            new THREE.Mesh(postGeo, material).position.set(2.3, 2, 1.8)
        ];
        posts.forEach(post => bed.add(post));

        // Canopy fabric
        const canopy = new THREE.Mesh(
            new THREE.BoxGeometry(5.5, 0.1, 4.5),
            new THREE.MeshPhongMaterial({ 
                color: 0xFFB6C1,
                transparent: true,
                opacity: 0.7
            })
        );
        canopy.position.y = 4;
        bed.add(canopy);

        return bed;
    }

    createGamingDesk() {
        const desk = new THREE.Group();
        const mainMaterial = new THREE.MeshPhongMaterial({ color: 0x2F4F4F });
        
        // Curved desktop
        const desktop = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 3, 0.3, 64, 1, true, 0, Math.PI),
            mainMaterial
        );
        desktop.rotation.x = Math.PI/2;
        desktop.position.y = 1.2;
        desk.add(desktop);

        // Monitor
        const monitor = new THREE.Mesh(
            new THREE.BoxGeometry(2, 1.5, 0.1),
            new THREE.MeshPhongMaterial({ color: 0x1A1A1A })
        );
        monitor.position.set(0, 2.3, 0.2);
        desk.add(monitor);

        return desk;
    }

    createWardrobe() {
        const wardrobe = new THREE.Group();
        const material = new THREE.MeshPhongMaterial({ color: 0xD4AF37 });
        
        // Main body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(3, 6, 2),
            material
        );
        wardrobe.add(body);

        // Mirror door
        const mirror = new THREE.Mesh(
            new THREE.BoxGeometry(1.4, 5.8, 0.1),
            new THREE.MeshPhongMaterial({
                color: 0x7EC0EE,
                opacity: 0.8,
                transparent: true
            })
        );
        mirror.position.x = 0.7;
        wardrobe.add(mirror);

        // Regular door
        const door = mirror.clone();
        door.material = material;
        door.position.x = -0.7;
        wardrobe.add(door);

        return wardrobe;
    }

    setupControls() {
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target = character.position;
        controls.enablePan = false;
        controls.minDistance = 6;
        controls.maxDistance = 12;
        controls.minPolarAngle = Math.PI/4;
        controls.maxPolarAngle = Math.PI/2;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        document.addEventListener('keydown', (e) => {
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            direction.y = 0;

            // Smooth acceleration
            if(['w','a','s','d'].includes(e.key.toLowerCase())) {
                MOVEMENT.currentSpeed = Math.min(
                    MOVEMENT.currentSpeed + MOVEMENT.acceleration,
                    MOVEMENT.maxSpeed
                );
            }

            switch(e.key.toLowerCase()) {
                case 'w':
                    character.position.add(direction.multiplyScalar(MOVEMENT.currentSpeed));
                    character.rotation.y = Math.atan2(-direction.x, -direction.z);
                    break;
                case 's':
                    character.position.add(direction.multiplyScalar(-MOVEMENT.currentSpeed));
                    character.rotation.y = Math.atan2(direction.x, direction.z);
                    break;
                case 'a':
                    character.rotation.y += ROTATION_SPEED;
                    break;
                case 'd':
                    character.rotation.y -= ROTATION_SPEED;
                    break;
            }

            // Bounce animation
            character.position.y = 1 + Math.abs(Math.sin(performance.now()/150)) * 0.2;
            controls.target.copy(character.position);
        });

        document.addEventListener('keyup', () => {
            MOVEMENT.currentSpeed = 0;
        });

        document.addEventListener('mousemove', (e) => {
            const mouse = new THREE.Vector2(
                (e.clientX / window.innerWidth) * 2 - 1,
                -(e.clientY / window.innerHeight) * 2 + 1
            );

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(interactiveObjects);

            const tooltip = document.getElementById('interaction-tooltip');
            tooltip.style.display = intersects.length > 0 ? 'block' : 'none';
            if(intersects.length > 0) {
                tooltip.textContent = `Interact with ${intersects[0].object.parent.type}`;
            }
        });

        document.addEventListener('click', (e) => {
            const mouse = new THREE.Vector2(
                (e.clientX / window.innerWidth) * 2 - 1,
                -(e.clientY / window.innerHeight) * 2 + 1
            );

            raycaster.setFromCamera(mouse, camera);
            const intersects = raycaster.intersectObjects(interactiveObjects);

            if(intersects.length > 0) {
                const obj = intersects[0].object.parent;
                alert(`Interacted with ${obj.type}!`);
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = clock.getDelta();
        if(mixer) mixer.update(delta);
        controls.update();
        renderer.render(scene, camera);
    }
}

new Game();
