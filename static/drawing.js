document.addEventListener('DOMContentLoaded', function() {

    const canvas = document.getElementById('drawing-canvas');
    const ctx = canvas.getContext('2d');
    const brushPreview = document.getElementById('brush-preview');
    

    const state = {
        isDrawing: false,
        currentTool: 'brush',
        currentColor: '#000000',
        brushSize: 5,
        lastX: 0,
        lastY: 0
    };


    function initCanvas() {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = state.currentColor;
        ctx.lineWidth = state.brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }


    function updateBrushPreview(x, y) {
        if (!x || !y) {
            brushPreview.style.display = 'none';
            return;
        }
        
        const size = state.brushSize;
        const color = state.currentTool === 'eraser' ? 'rgba(200,200,200,0.5)' : `${state.currentColor}80`;
        const borderColor = state.currentTool === 'eraser' ? '#999' : state.currentColor;
        
        brushPreview.style.display = 'block';
        brushPreview.style.width = `${size}px`;
        brushPreview.style.height = `${size}px`;
        brushPreview.style.backgroundColor = color;
        brushPreview.style.border = `1px solid ${borderColor}`;
        brushPreview.style.left = `${x}px`;
        brushPreview.style.top = `${y}px`;
        brushPreview.style.borderRadius = `${size/2}px`;
    }


    function getPosition(e) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }


    function startDrawing(e) {
        state.isDrawing = true;
        const pos = getPosition(e);
        state.lastX = pos.x;
        state.lastY = pos.y;
        

        if (state.currentTool === 'brush') {
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, state.brushSize/2, 0, Math.PI*2);
            ctx.fill();
        } else if (state.currentTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, state.brushSize/2, 0, Math.PI*2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        }
    }


    function draw(e) {
        if (!state.isDrawing) return;
        
        const pos = getPosition(e);
        
        if (state.currentTool === 'brush') {
            ctx.strokeStyle = state.currentColor;
            ctx.lineWidth = state.brushSize;
            ctx.beginPath();
            ctx.moveTo(state.lastX, state.lastY);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        } 
        else if (state.currentTool === 'eraser') {
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, state.brushSize/2, 0, Math.PI*2);
            ctx.fill();
            ctx.globalCompositeOperation = 'source-over';
        }
        
        state.lastX = pos.x;
        state.lastY = pos.y;
        updateBrushPreview(pos.x, pos.y);
    }


    function stopDrawing() {
        state.isDrawing = false;
    }


    function clearCanvas() {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }


    function saveCanvas() {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = 'drawing.png';
        link.href = dataUrl;
        link.click();
    }


    function setActiveTool(tool) {
        state.currentTool = tool;
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById(`${tool}-btn`).classList.add('active');
    }

    function initEvents() {

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', (e) => {
            const pos = getPosition(e);
            updateBrushPreview(pos.x, pos.y);
            draw(e);
        });
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseout', stopDrawing);
        

        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startDrawing(e.touches[0]);
        });
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const pos = getPosition(e.touches[0]);
            updateBrushPreview(pos.x, pos.y);
            draw(e.touches[0]);
        });
        canvas.addEventListener('touchend', stopDrawing);

        document.getElementById('brush-btn').addEventListener('click', () => setActiveTool('brush'));
        document.getElementById('eraser-btn').addEventListener('click', () => setActiveTool('eraser'));
        document.getElementById('clear-btn').addEventListener('click', clearCanvas);
        document.getElementById('save-btn').addEventListener('click', saveCanvas);
        document.getElementById('back-btn').addEventListener('click', () => {
            window.location.href = '/';
        });


        const brushSizeInput = document.getElementById('brush-size');
        const brushSizeValue = document.getElementById('brush-size-value');
        brushSizeInput.addEventListener('input', () => {
            state.brushSize = parseInt(brushSizeInput.value);
            brushSizeValue.textContent = state.brushSize;
        });


        document.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                state.currentColor = option.getAttribute('data-color');
                setActiveTool('brush');
            });
        });
    }


    initCanvas();
    initEvents();
});