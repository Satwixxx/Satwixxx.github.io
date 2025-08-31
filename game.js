<!DOCTYPE html>
<html>
<head>
    <title>3D Character Game</title>
    <style>
        body {
            margin: 0;
            overflow: hidden;
            background-color: #000;
        }
        canvas {
            display: block;
        }
        #instructions {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            color: white;
            background: rgba(0, 0, 0, 0.7);
            padding: 20px;
            border-radius: 10px;
            font-family: Arial, sans-serif;
            pointer-events: auto;
            cursor: pointer;
            z-index: 10;
        }
        #instructions.hidden {
            display: none;
        }
        #loading {
            position: absolute;
            top: 10px;
            left: 10px;
            color: white;
            background: rgba(0, 0, 0, 0.5);
            padding: 5px;
            font-family: Arial, sans-serif;
        }
        #debug {
            position: absolute;
            bottom: 10px;
            left: 10px;
            color: white;
            background: rgba(0, 0, 0, 0.5);
            padding: 5px;
            font-family: Arial, sans-serif;
        }
    </style>
</head>
<body>
    <div id="instructions">
        Click to play<br>
        WASD = Move<br>
        SPACE = Jump<br>
        MOUSE = Look around<br>
        ESC = Pause
    </div>
    <div id="loading">Loading...</div>
    <div id="debug"></div>

    <!-- Load Three.js from CDN -->
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script>
        // Check if Three.js loaded correctly
        if (typeof THREE === 'undefined') {
            document.getElementById('debug').innerHTML = 'Error: Three.js failed to load. Check your internet connection.';
        } else {
            document.getElementById('debug').innerHTML = 'Three.js loaded successfully';
        }
    </script>
    <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
    
    <script>
        // Show loading status
        window.addEventListener('load', function() {
            document.getElementById('loading').innerHTML = 'All resources loaded, starting game...';
            setTimeout(function() {
                document.getElementById('loading').style.display = 'none';
            }, 3000);
        });
    </script>
    
    <script src="game.js"></script>
</body>
</html>
