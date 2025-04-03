const canvas = document.getElementById("gameCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

// 1. Verify WebGL support
if (!BABYLON.Engine.isSupported()) {
    alert("WebGL not supported!");
    throw new Error("WebGL not supported");
}

// 2. Physics initialization
scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());

// 3. Lighting adjustments
const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
light.intensity = 0.7;

const directionalLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-0.5, -1, -0.5), scene);
directionalLight.intensity = 0.5;

// 4. Camera configuration
const camera = new BABYLON.FollowCamera("followCam", new BABYLON.Vector3(0, 1.5, -3), scene);
camera.radius = 4;
camera.heightOffset = 1.5;
camera.rotationOffset = 180;
camera.cameraAcceleration = 0.05;
camera.maxCameraSpeed = 5;

// 5. Simplified bedroom walls (fixed positions)
const createBedroom = () => {
    // Floor with visible material
    const floor = BABYLON.MeshBuilder.CreateGround("floor", {width: 10, height: 10}, scene);
    const floorMat = new BABYLON.StandardMaterial("floorMat", scene);
    floorMat.diffuseColor = new BABYLON.Color3(0.9, 0.9, 0.85);
    floor.material = floorMat;
    floor.physicsImpostor = new BABYLON.PhysicsImpostor(floor, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);

    // Walls with proper positioning
    const wallMat = new BABYLON.StandardMaterial("wallMat", scene);
    wallMat.diffuseColor = new BABYLON.Color3(0.95, 0.95, 0.95);
    
    const createWall = (width, height, position, rotation) => {
        const wall = BABYLON.MeshBuilder.CreateBox("wall", {width, height, depth: 0.2}, scene);
        wall.position = position;
        wall.rotation.y = rotation;
        wall.material = wallMat;
        wall.physicsImpostor = new BABYLON.PhysicsImpostor(wall, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
        return wall;
    };

    // Create walls around the floor
    createWall(10, 4, new BABYLON.Vector3(0, 2, 5), 0);         // Back wall
    createWall(10, 4, new BABYLON.Vector3(0, 2, -5), 0);        // Front wall
    createWall(10, 4, new BABYLON.Vector3(5, 2, 0), Math.PI/2); // Right wall
    createWall(10, 4, new BABYLON.Vector3(-5, 2, 0), Math.PI/2);// Left wall
};

// 6. Improved character
const createCharacter = () => {
    const body = BABYLON.MeshBuilder.CreateCapsule("body", {height: 1.6}, scene);
    body.position.y = 0.8;
    
    // Character appearance
    const head = BABYLON.MeshBuilder.CreateSphere("head", {diameter: 0.4}, scene);
    head.parent = body;
    head.position.y = 0.7;
    
    const hair = BABYLON.MeshBuilder.CreateCylinder("hair", {diameterTop: 0.4, diameterBottom: 0.5, height: 0.2}, scene);
    hair.parent = head;
    hair.position.y = 0.2;
    hair.material = new BABYLON.StandardMaterial("hairMat", scene);
    hair.material.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.1);

    const dress = BABYLON.MeshBuilder.CreateCylinder("dress", {diameterTop: 0.5, diameterBottom: 0.7, height: 0.7}, scene);
    dress.parent = body;
    dress.position.y = -0.35;
    dress.material = new BABYLON.StandardMaterial("dressMat", scene);
    dress.material.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.4);

    body.physicsImpostor = new BABYLON.PhysicsImpostor(body, BABYLON.PhysicsImpostor.CapsuleImpostor, { mass: 1 }, scene);
    camera.lockedTarget = body;
    return body;
};

// 7. Movement system
const setupMovement = (character) => {
    const inputMap = {};
    scene.actionManager = new BABYLON.ActionManager(scene);
    
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyDownTrigger,
        (evt) => inputMap[evt.sourceEvent.key.toLowerCase()] = true
    ));
    
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyUpTrigger,
        (evt) => inputMap[evt.sourceEvent.key.toLowerCase()] = false
    ));

    scene.onBeforeRenderObservable.add(() => {
        const forward = new BABYLON.Vector3(
            Math.sin(camera.rotation.y),
            0,
            Math.cos(camera.rotation.y)
        );
        const right = forward.cross(BABYLON.Vector3.Up());

        const speed = 0.1;
        const moveDirection = new BABYLON.Vector3(0, 0, 0);

        if (inputMap['w']) moveDirection.addInPlace(forward);
        if (inputMap['s']) moveDirection.addInPlace(forward.scale(-1));
        if (inputMap['a']) moveDirection.addInPlace(right.scale(-1));
        if (inputMap['d']) moveDirection.addInPlace(right);

        if (moveDirection.length() > 0) {
            moveDirection.normalize();
            character.moveWithCollisions(moveDirection.scale(speed));
        }
    });
};

// Initialize game
const initGame = () => {
    createBedroom();
    const character = createCharacter();
    setupMovement(character);
    
    // Initial camera position
    camera.position = new BABYLON.Vector3(0, 1.5, -3);
};

initGame();

// Render loop
engine.runRenderLoop(() => {
    scene.render();
});

// Handle window resize
window.addEventListener("resize", () => engine.resize());
