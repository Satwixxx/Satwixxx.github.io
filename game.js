const canvas = document.getElementById("gameCanvas");
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);
let score = 0;

// Physics
scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());

// Lighting
new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
const directionalLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-0.5, -1, -0.5), scene);
directionalLight.intensity = 0.8;

// Camera
const camera = new BABYLON.FollowCamera("followCam", new BABYLON.Vector3(0, 2, -5), scene);
camera.radius = 5; // Distance from character
camera.heightOffset = 2; // Height offset
camera.rotationOffset = 180; // Angle
camera.cameraAcceleration = 0.05;
camera.maxCameraSpeed = 10;

// Bedroom
const createBedroom = () => {
    // Floor
    const floor = BABYLON.MeshBuilder.CreateBox("floor", {width: 10, height: 0.1, depth: 10}, scene);
    floor.position.y = -0.05;
    floor.physicsImpostor = new BABYLON.PhysicsImpostor(floor, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
    
    // Walls
    const wallMaterial = new BABYLON.StandardMaterial("wallMat", scene);
    wallMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
    
    const walls = [];
    for(let i = 0; i < 4; i++) {
        const wall = BABYLON.MeshBuilder.CreateBox(`wall${i}`, {width: 10, height: 4, depth: 0.2}, scene);
        wall.rotation.y = (Math.PI/2) * i;
        wall.position = new BABYLON.Vector3(i < 2 ? 5 : -5, 2, i%3 === 0 ? 5 : -5);
        wall.material = wallMaterial;
        wall.physicsImpostor = new BABYLON.PhysicsImpostor(wall, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0 }, scene);
    }

    // Bed
    const bed = BABYLON.MeshBuilder.CreateBox("bed", {width: 3, height: 1, depth: 2}, scene);
    bed.position.set(-3, 0.5, 3);
    bed.material = new BABYLON.StandardMaterial("bedMat", scene);
    bed.material.diffuseColor = new BABYLON.Color3(0.4, 0.2, 0.1);

    // Desk
    const desk = BABYLON.MeshBuilder.CreateBox("desk", {width: 2, height: 1, depth: 1}, scene);
    desk.position.set(3, 0.5, 3);
    
    // Rug
    const rug = BABYLON.MeshBuilder.CreateCylinder("rug", {diameter: 2, height: 0.1}, scene);
    rug.position.set(0, 0, 0);
    rug.material = new BABYLON.StandardMaterial("rugMat", scene);
    rug.material.diffuseColor = new BABYLON.Color3(0.5, 0.3, 0.2);
};

// Character
const createCharacter = () => {
    // Basic female character
    const body = BABYLON.MeshBuilder.CreateCylinder("body", {diameterTop: 0.5, diameterBottom: 0.7, height: 1.7}, scene);
    const head = BABYLON.MeshBuilder.CreateSphere("head", {diameter: 0.5}, scene);
    head.parent = body;
    head.position.y = 1;
    
    // Hair
    const hair = BABYLON.MeshBuilder.CreateSphere("hair", {diameter: 0.55}, scene);
    hair.parent = head;
    hair.material = new BABYLON.StandardMaterial("hairMat", scene);
    hair.material.diffuseColor = new BABYLON.Color3(0.3, 0.2, 0.1);
    
    // Dress
    const dress = BABYLON.MeshBuilder.CreateCylinder("dress", {diameterTop: 0.7, diameterBottom: 1, height: 0.8}, scene);
    dress.parent = body;
    dress.position.y = -0.4;
    dress.material = new BABYLON.StandardMaterial("dressMat", scene);
    dress.material.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.4);
    
    body.position.y = 0.85;
    body.physicsImpostor = new BABYLON.PhysicsImpostor(body, BABYLON.PhysicsImpostor.CylinderImpostor, { mass: 1 }, scene);
    
    camera.lockedTarget = body;
    return body;
};

// Game Setup
const setupGame = () => {
    createBedroom();
    const character = createCharacter();
    
    // Movement
    const inputMap = {};
    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
        inputMap[evt.sourceEvent.key.toLowerCase()] = true;
    }));
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (evt) => {
        inputMap[evt.sourceEvent.key.toLowerCase()] = false;
    }));

    const moveSpeed = 0.1;
    scene.onBeforeRenderObservable.add(() => {
        const forward = camera.getForwardRay().direction;
        const right = camera.getRightRay().direction;
        
        if(inputMap['w']) character.moveWithCollisions(forward.scale(moveSpeed));
        if(inputMap['s']) character.moveWithCollisions(forward.scale(-moveSpeed));
        if(inputMap['a']) character.moveWithCollisions(right.scale(-moveSpeed));
        if(inputMap['d']) character.moveWithCollisions(right.scale(moveSpeed));
    });
};

// Run game
setupGame();
engine.runRenderLoop(() => scene.render());

// Resize
window.addEventListener("resize", () => engine.resize());
