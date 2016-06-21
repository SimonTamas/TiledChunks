var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var TiledChunks;
(function (TiledChunks) {
    var Chunk = (function () {
        function Chunk(_map, _row, _column) {
            // Store vars
            this.map = _map;
            this.row = _row;
            this.column = _column;
            this.colliders = [];
            this.triggers = [];
            this.x = this.column * this.map.data.chunkWidth;
            this.y = this.row * this.map.data.chunkHeight;
            // Easy way to keep track of the chunks
            this.coord = new TiledChunks.ChunkCoord(this.row, this.column);
            // Create the layers
            this.layers = [];
            var layerData;
            var chunkLayer;
            for (var l = 0; l < this.map.data.layers.length; l++) {
                layerData = this.map.data.layers[l];
                chunkLayer = layerData.GetChunkLayer(this);
                if (layerData.isCollisionLayer)
                    this.AddColliders(chunkLayer, layerData.isTriggerLayer);
                this.layers.push(chunkLayer);
            }
            Chunk.chunks++;
        }
        /*
            When a camera enters a new chunk
            we prepare to deactivate chunks
        */
        Chunk.prototype.PrematureDeactivation = function () {
            this.deactivating = true;
        };
        /*
            Once the correct chunks have been activated we
            can deactivate the ones which didnt get activated
        */
        Chunk.prototype.DeactivationCheck = function () {
            if (this.deactivating)
                this.Deactivate();
        };
        /* ------------------------------------------------------------------------------------------ */
        /* ----------------------------------- DRAWING AND ERASING ---------------------------------- */
        /* ------------------------------------------------------------------------------------------ */
        Chunk.prototype.DrawChunk = function () {
            if (this.drawn)
                return;
            this.drawn = true;
            for (var l = 0; l < this.layers.length; l++) {
                this.layers[l].DrawLayer();
            }
        };
        Chunk.prototype.EraseChunk = function () {
            if (this.drawn) {
                this.drawn = false;
                for (var l = 0; l < this.layers.length; l++) {
                    this.layers[l].EraseLayer();
                }
            }
        };
        /* ------------------------------------------------------------------------------------------ */
        /* ----------------------------------- DRAWING AND ERASING ----------------------------------
        /* ------------------------------------------------------------------------------------------ */
        Chunk.prototype.Activate = function () {
            this.deactivating = false;
            if (!this.active) {
                this.active = true;
                this.map.chunksDrawn++;
                this.DrawChunk();
            }
        };
        Chunk.prototype.Deactivate = function () {
            if (this.active) {
                this.active = false;
                this.map.chunksDrawn--;
                this.EraseChunk();
            }
        };
        Chunk.prototype.ActivateAdjacent = function () {
            if (!this.adjacentGraphicalChunks)
                this.CacheAdjacentGraphicalChunks();
            for (var a = 0; a < this.adjacentGraphicalChunks.length; a++)
                this.adjacentGraphicalChunks[a].Activate();
        };
        Chunk.prototype.CacheAdjacentGraphicalChunks = function (_callback) {
            this.adjacentGraphicalChunks = this.GetVisibleChunks();
            if (_callback)
                _callback();
        };
        Chunk.prototype.CacheAdjacentCollisionChunks = function (_callback) {
            this.adjacentCollisionChunks = this.GetAdjacentChunks(0, 0);
            if (_callback)
                _callback();
        };
        /*
            1 - UP & RIGHT
            2 - UP & LEFT
            3 - DOWN & LEFT
            4 - DOWN * RIGHT
        */
        Chunk.MergeChunks = function (_chunks, _withChunks) {
            for (var c = 0; c < _withChunks.length; c++) {
                if (!TiledChunks.Chunk.ChunkInChunkArray(_withChunks[c], _chunks)) {
                    _chunks.push(_withChunks[c]);
                }
            }
            return _chunks;
        };
        Chunk.prototype.GetVisibleChunks = function () {
            var visible = [];
            // A row height is 
            var needX = Math.ceil(this.map.game.width / (this.map.data.chunkTileColumns * this.map.data.tileWidth));
            var needY = Math.ceil(this.map.game.height / (this.map.data.chunkTileRows * this.map.data.tileHeight));
            // Go up half
            var up = Math.ceil(needY / 2);
            var y = 0;
            var atY = this.row;
            var canGoUp = true;
            while (canGoUp) {
                canGoUp = atY - y > 0 && y < up;
                if (canGoUp)
                    y++;
            }
            // Now go to the upmost left
            var left = Math.ceil(needX / 2) + 1;
            var x = 0;
            var atX = this.column;
            var canGoLeft = true;
            while (canGoLeft) {
                canGoLeft = atX - x > 0 && x < left;
                if (canGoLeft)
                    x++;
            }
            var topLeft = this.map.chunks[this.row - y][this.column - x];
            if (topLeft) {
                for (var r = 0; r < needY + 2; r++) {
                    for (var c = 0; c < needX + 3; c++) {
                        var rY = topLeft.row + r;
                        var cX = topLeft.column + c;
                        if (this.map.chunks[rY] && this.map.chunks[rY][cX])
                            visible.push(this.map.chunks[rY][cX]);
                    }
                }
            }
            return visible;
        };
        Chunk.prototype.GetAdjacentChunks = function (_depthX, _depthY, _direction) {
            var adjacent = [];
            // If this is being called recursivly
            // then we have a direction we came from
            if (_direction != null) {
                switch (_direction) {
                    case 1:
                        // UP
                        if (this.row - 1 >= 0) {
                            adjacent.push(this.map.chunks[this.row - 1][this.column]);
                            if (_depthY > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row - 1][this.column].GetAdjacentChunks(_depthX, _depthY - 1, _direction)));
                        }
                        // RIGHT
                        if (this.column + 1 < this.map.data.chunkColumns) {
                            adjacent.push(this.map.chunks[this.row][this.column + 1]);
                            if (_depthX > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row][this.column + 1].GetAdjacentChunks(_depthX - 1, _depthY, _direction)));
                        }
                        break;
                    case 2:
                        // UP
                        if (this.row - 1 >= 0) {
                            adjacent.push(this.map.chunks[this.row - 1][this.column]);
                            if (_depthY > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row - 1][this.column].GetAdjacentChunks(_depthX, _depthY - 1, _direction)));
                        }
                        // LEFT
                        if (this.column - 1 >= 0) {
                            adjacent.push(this.map.chunks[this.row][this.column - 1]);
                            if (_depthX > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row][this.column - 1].GetAdjacentChunks(_depthX - 1, _depthY, _direction)));
                        }
                        break;
                    case 3:
                        // DOWN
                        if (this.row + 1 < this.map.data.chunkRows) {
                            adjacent.push(this.map.chunks[this.row + 1][this.column]);
                            if (_depthY > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row + 1][this.column].GetAdjacentChunks(_depthX, _depthY - 1, _direction)));
                        }
                        // LEFT
                        if (this.column - 1 >= 0) {
                            adjacent.push(this.map.chunks[this.row][this.column - 1]);
                            if (_depthX > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row][this.column - 1].GetAdjacentChunks(_depthX - 1, _depthY, _direction)));
                        }
                        break;
                    case 4:
                        // DOWN
                        if (this.row + 1 < this.map.data.chunkRows) {
                            adjacent.push(this.map.chunks[this.row + 1][this.column]);
                            if (_depthY > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row + 1][this.column].GetAdjacentChunks(_depthX, _depthY - 1, _direction)));
                        }
                        // RIGHT
                        if (this.column + 1 < this.map.data.chunkColumns) {
                            adjacent.push(this.map.chunks[this.row][this.column + 1]);
                            if (_depthX > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row][this.column + 1].GetAdjacentChunks(_depthX - 1, _depthY, _direction)));
                        }
                        break;
                }
            }
            else {
                // This is the center chunk 
                // lets go in 4 directions
                for (var d = 1; d < 5; d++) {
                    var chunksInDirection = this.GetAdjacentChunks(_depthX, _depthY, d);
                    for (var c = 0; c < chunksInDirection.length; c++) {
                        if (!TiledChunks.Chunk.ChunkInChunkArray(chunksInDirection[c], adjacent))
                            adjacent.push(chunksInDirection[c]);
                    }
                }
                // Now we need to add the 4 corners
                var furtestLeft = this.column;
                var furtestRight = this.column;
                var furtestTop = this.row;
                var furtestDown = this.row;
                var cC = 0;
                var cR = 0;
                for (var i = 0; i < adjacent.length; i++) {
                    cC = adjacent[i].coord.column;
                    cR = adjacent[i].coord.row;
                    if (cC > furtestRight)
                        furtestRight = cC;
                    else if (cC < furtestLeft)
                        furtestLeft = cC;
                    if (cR > furtestDown)
                        furtestDown = cR;
                    else if (cR < furtestTop)
                        furtestTop = cR;
                }
                TiledChunks.Chunk.MergeChunks(adjacent, [this.map.chunks[furtestTop][furtestLeft]]);
                TiledChunks.Chunk.MergeChunks(adjacent, [this.map.chunks[furtestTop][furtestRight]]);
                TiledChunks.Chunk.MergeChunks(adjacent, [this.map.chunks[furtestDown][furtestLeft]]);
                TiledChunks.Chunk.MergeChunks(adjacent, [this.map.chunks[furtestDown][furtestRight]]);
            }
            return adjacent;
        };
        Chunk.ChunkInChunkArray = function (_chunk, _chunkArray) {
            var i = 0;
            while (i < _chunkArray.length && _chunkArray[i].coord.GetKey() != _chunk.coord.GetKey())
                i++;
            return i < _chunkArray.length;
        };
        Chunk.prototype.AddColliders = function (_chunkLayer, _trigger) {
            var collisionX;
            var collisionY;
            var rect;
            var tileID;
            for (var r = 0; r < _chunkLayer.tiles.length; r++) {
                if (_chunkLayer.tiles[r]) {
                    for (var c = 0; c < _chunkLayer.tiles[r].length; c++) {
                        if (_chunkLayer.tiles[r][c] && _chunkLayer.tiles[r][c].data.id != _chunkLayer.layer.emptyID) {
                            tileID = _chunkLayer.tiles[r][c].data.id;
                            collisionX = _chunkLayer.chunk.x + (c * this.map.data.tileWidth);
                            collisionY = _chunkLayer.chunk.y + (r * this.map.data.tileHeight);
                            if (_trigger) {
                                rect = new TiledChunks.Trigger(this.map.game, tileID, collisionX, collisionY);
                                this.triggers.push(rect);
                            }
                            else {
                                rect = new TiledChunks.Collider(this.map.game, collisionX, collisionY, null, null, (this.row * this.map.data.chunkTileRows) + r, (this.column * this.map.data.chunkTileColumns) + c);
                                this.colliders.push(rect);
                                this.map.quadtree.insert(rect);
                            }
                            this.map.game.physics.arcade.enable(rect);
                            rect.body.setSize(this.map.data.tileWidth, this.map.data.tileHeight, 0, 0);
                            rect.body.immovable = true;
                            rect.name = this.map.data.GetTilesetForId(tileID).GetPropertyValueFromId(tileID, "name");
                        }
                    }
                }
            }
        };
        Chunk.prototype.RemoveCollider = function (_collider) {
            var c = 0;
            while (c < this.colliders.length && _collider != this.colliders[c])
                c++;
            if (c < this.colliders.length)
                this.colliders.splice(c, 1);
        };
        Chunk.prototype.AddCollider = function (_collider) {
            this.colliders.push(_collider);
            this.map.quadtree.insert(_collider);
        };
        Chunk.prototype.GetColliderByTile = function (_tile) {
            var c = 0;
            while (c < this.colliders.length && (this.colliders[c].x + "/" + this.colliders[c].y) != _tile.key)
                c++;
            if (c < this.colliders.length)
                return this.colliders[c];
        };
        Chunk.chunks = 0;
        return Chunk;
    }());
    TiledChunks.Chunk = Chunk;
})(TiledChunks || (TiledChunks = {}));
var TiledChunks;
(function (TiledChunks) {
    var ChunkCoord = (function () {
        function ChunkCoord(_row, _column) {
            this.row = _row;
            this.column = _column;
        }
        ChunkCoord.prototype.GetKey = function () {
            return this.row + "-" + this.column;
        };
        return ChunkCoord;
    }());
    TiledChunks.ChunkCoord = ChunkCoord;
})(TiledChunks || (TiledChunks = {}));
var TiledChunks;
(function (TiledChunks) {
    var ChunkLayer = (function () {
        function ChunkLayer(_chunk, _layer, _tileDatas) {
            this.chunk = _chunk;
            this.layer = _layer;
            this.mapLayer = this.chunk.map.GetLayer(this.layer.name);
            this.drawn = false;
            // Store tiles in memory
            this.tiles = [];
            var id;
            var tile;
            for (var cR = 0; cR < _chunk.map.data.chunkTileRows; cR++) {
                this.tiles[cR] = [];
                for (var cC = 0; cC < _chunk.map.data.chunkTileColumns; cC++) {
                    if (_tileDatas[cR] && _tileDatas[cR][cC] != null) {
                        tile = new TiledChunks.Tile(this, cC, cR, _tileDatas[cR][cC]);
                        this.tiles[cR][cC] = tile;
                    }
                }
            }
            id = null;
            tile = null;
        }
        ChunkLayer.prototype.DrawLayer = function () {
            if (this.drawn)
                return;
            this.drawn = true;
            var tile;
            for (var r = 0; r < this.tiles.length; r++) {
                for (var c = 0; c < this.tiles[r].length; c++) {
                    tile = this.tiles[r][c];
                    if (tile)
                        tile.DrawTile(this);
                }
            }
        };
        ChunkLayer.prototype.EraseLayer = function () {
            if (this.drawn) {
                this.drawn = false;
                //this.chunk.map.GetLayer(this.layer.name).group.remove(this.container);
                var tile;
                for (var r = 0; r < this.tiles.length; r++) {
                    for (var c = 0; c < this.tiles[r].length; c++) {
                        tile = this.tiles[r][c];
                        if (tile)
                            tile.EraseTile(this);
                    }
                }
            }
        };
        return ChunkLayer;
    }());
    TiledChunks.ChunkLayer = ChunkLayer;
})(TiledChunks || (TiledChunks = {}));
var TiledChunks;
(function (TiledChunks) {
    var Collider = (function (_super) {
        __extends(Collider, _super);
        function Collider(_game, _x, _y, _key, _frame, _r, _c) {
            _super.call(this, _game, _x, _y, _key, _frame);
            this.key = "ColliderSprite" + _x + "/" + _y;
            this.r = _r;
            this.c = _c;
        }
        return Collider;
    }(Phaser.Sprite));
    TiledChunks.Collider = Collider;
})(TiledChunks || (TiledChunks = {}));
var TiledChunks;
(function (TiledChunks) {
    var LayerData = (function () {
        function LayerData(_name, _batchLayer, _emptyID, _collision, _trigger) {
            this.name = _name;
            this.emptyID = _emptyID || 0;
            this.batch = _batchLayer || false;
            this.isCollisionLayer = _collision || false;
            this.isTriggerLayer = _trigger || false;
        }
        // Convert two dimension list of tile IDs ( from Tiled )
        // into TiledChunks.TileData for easy use
        LayerData.prototype.SetTiles = function (_tileList) {
            this.tileDatas = [];
            var id;
            for (var r = 0; r < _tileList.length; r++) {
                this.tileDatas[r] = [];
                for (var c = 0; c < _tileList[r].length; c++) {
                    id = _tileList[r][c];
                    if (id != this.emptyID)
                        this.tileDatas[r][c] = new TiledChunks.TileData(id);
                }
            }
            id = null;
        };
        LayerData.prototype.GetTileIDs = function (_map) {
            var tiles = [];
            var id = 0;
            for (var r = 0; r < _map.data.chunkRows * _map.data.chunkTileRows; r++) {
                tiles[r] = [];
                for (var c = 0; c < _map.data.chunkColumns * _map.data.chunkTileColumns; c++) {
                    if (this.tileDatas[r] && this.tileDatas[r][c])
                        tiles[r][c] = this.tileDatas[r][c].id;
                    else
                        tiles[r][c] = 0;
                }
            }
            return tiles;
        };
        LayerData.prototype.GetChunkLayer = function (_chunk) {
            var chunkTileDatas = [];
            if (this.tileDatas) {
                var id;
                var tileRow;
                var tileColumn;
                for (var rowOffset = 0; rowOffset < _chunk.map.data.chunkTileRows; rowOffset++) {
                    chunkTileDatas[rowOffset] = [];
                    for (var columnOffset = 0; columnOffset < _chunk.map.data.chunkTileColumns; columnOffset++) {
                        tileRow = (_chunk.row * _chunk.map.data.chunkTileRows) + rowOffset;
                        tileColumn = (_chunk.column * _chunk.map.data.chunkTileColumns) + columnOffset;
                        if (this.tileDatas[tileRow] && this.tileDatas[tileRow][tileColumn]) {
                            id = this.tileDatas[tileRow][tileColumn].id;
                            if (id != this.emptyID)
                                chunkTileDatas[rowOffset][columnOffset] = new TiledChunks.TileData(id);
                            else
                                chunkTileDatas[rowOffset][columnOffset] = null;
                        }
                    }
                }
                id = null;
                tileRow = null;
                tileColumn = null;
            }
            return new TiledChunks.ChunkLayer(_chunk, this, chunkTileDatas);
        };
        return LayerData;
    }());
    TiledChunks.LayerData = LayerData;
})(TiledChunks || (TiledChunks = {}));
var TiledChunks;
(function (TiledChunks) {
    var Map = (function () {
        function Map(_game, _data, _progressCallback, _progressCallbackContext) {
            this.pathfindingDeadZones = [];
            // Store varables
            this.game = _game;
            this.data = _data;
            // Init variables
            this.container = new Phaser.Group(_game, null, "world-container", false);
            this.quadtree = new Phaser.QuadTree(0, 0, _data.worldWidth, _data.worldHeight, 10, 5);
            this.progress = 0;
            this.progressCallback = _progressCallback;
            this.progressCallbackContext = _progressCallbackContext;
            this.progressTotal = (_data.chunkRows * _data.chunkColumns) * 2;
            this.pathfinding = new EasyStar.js();
            this.pathfinding.setAcceptableTiles([0]);
            this.pathfinding.disableDiagonals();
            // Colliders
            this.colliders = [];
            this.lazyColliders = [];
            this.collisionMatrixEnabled = true;
            // For debug
            this.collisionChecks = 0;
            this.triggerChecks = 0;
            this.chunksDrawn = 0;
            // Create a group for each layer
            this.listeners = [];
            this.layers = [];
            var layerContainer;
            var layerData;
            for (var l = 0; l < this.data.layers.length; l++) {
                layerData = this.data.layers[l];
                if (layerData.batch)
                    layerContainer = new Phaser.SpriteBatch(this.game, this.container, layerData.name, false);
                else
                    layerContainer = new Phaser.Group(this.game, this.container, layerData.name, false);
                this.layers.push(new TiledChunks.MapLayer(layerContainer, layerData));
            }
            // Create the Chunks
            // chunkRows * chunkColumns ..... 100
            // r*chunkRows + c .............. x
            this.chunks = [];
            var chunk;
            for (var r = 0; r < this.data.chunkRows; r++) {
                this.chunks[r] = [];
                for (var c = 0; c < this.data.chunkColumns; c++) {
                    chunk = new TiledChunks.Chunk(this, r, c);
                    this.chunks[r][c] = chunk;
                }
            }
            // Each chunk has adjacent chunks 
            // around it, we cache them so
            // we dont have to calculate it later
            this.CacheAdjacentGraphicalChunks();
            this.CacheAdjacentCollisionChunks();
            // Updating the map causes it to be drawn...
            this.UpdateMap();
            this.UpdatePathfinding();
            _game.world.setBounds(0, 0, this.data.worldWidth, this.data.worldHeight);
            this.biggestDistance = Math.sqrt(Math.pow(this.data.worldWidth, 2) + Math.pow(this.data.worldHeight, 2));
        }
        // ----------------------------------------------------------------------------------------------
        // ----------------------------------- MAP EVENT HANDLING ---------------------------------------
        // ----------------------------------------------------------------------------------------------
        Map.prototype.AddListener = function (_sprite, _event, _callback, _callbackContext) {
            this.listeners.push(new TiledChunks.MapListener(_sprite, _event, _callback, _callbackContext));
        };
        Map.prototype.RemoveListener = function (_sprite, _event) {
            var i = 0;
            while (i < this.listeners.length && this.listeners[i] && (this.listeners[i].GetEvent() != _event || this.listeners[i].GetSprite() !== _sprite))
                i++;
            if (i < this.listeners.length) {
                if (!this.listeners[i]) {
                    this.listeners.splice(i, 1);
                    this.RemoveListener(_sprite, _event);
                }
                else
                    this.listeners.splice(i, 1);
            }
        };
        Map.prototype.OnTriggerEnter = function (_trigger, _collider) {
            for (var l = 0; l < this.listeners.length; l++)
                if (this.listeners[l].GetEvent() == TiledChunks.Map.MAP_EVENT_ON_TRIGGER_ENTER && this.listeners[l].GetSprite() == _collider)
                    this.listeners[l].GetCallback()(_trigger, this.listeners[l].GetCallbackContext());
        };
        Map.prototype.OnTriggerLeave = function (_trigger, _collider) {
            for (var l = 0; l < this.listeners.length; l++)
                if (this.listeners[l].GetEvent() == TiledChunks.Map.MAP_EVENT_ON_TRIGGER_LEAVE && this.listeners[l].GetSprite() == _collider)
                    this.listeners[l].GetCallback()(_trigger, this.listeners[l].GetCallbackContext());
        };
        Map.prototype.OnCollision = function (_collider, _other) {
            for (var l = 0; l < this.listeners.length; l++) {
                if (this.listeners[l].GetEvent() == TiledChunks.Map.MAP_EVENT_ON_COLLISION) {
                    if (this.listeners[l].GetSprite() == _collider)
                        this.listeners[l].GetCallback()(_other, this.listeners[l].GetCallbackContext(), _collider);
                    // Does the other one still exists? (Very rare case)
                    if (this.listeners[l])
                        if (this.listeners[l].GetSprite() == _other)
                            this.listeners[l].GetCallback()(_collider, this.listeners[l].GetCallbackContext(), _other);
                }
            }
        };
        // ----------------------------------------------------------------------------------------------
        // ----------------------------------- MAP EVENT HANDLING ---------------------------------------
        // ----------------------------------------------------------------------------------------------
        Map.prototype.EnableCollisionMatrix = function () {
            this.collisionMatrixEnabled = true;
            this.UpdatePathfinding();
        };
        Map.prototype.DisableCollisionMatrix = function () {
            this.collisionMatrixEnabled = false;
            this.UpdatePathfinding();
        };
        Map.prototype.GetCollisionMatrix = function () {
            var returnMatrix = [];
            var chunk;
            var collider;
            var r;
            var c;
            for (r = 0; r < this.data.chunkRows * this.data.chunkTileRows; r++) {
                returnMatrix[r] = [];
                for (c = 0; c < this.data.chunkColumns * this.data.chunkTileColumns; c++)
                    returnMatrix[r][c] = 0;
            }
            if (this.collisionMatrixEnabled) {
                for (r = 0; r < this.chunks.length; r++) {
                    for (c = 0; c < this.chunks[r].length; c++) {
                        chunk = this.chunks[r][c];
                        for (var l = 0; l < chunk.colliders.length; l++) {
                            collider = chunk.colliders[l];
                            returnMatrix[collider.r][collider.c] = 1;
                        }
                    }
                }
                for (var c = 0; c < this.colliders.length; c++) {
                    if (this.colliders[c].body.immovable) {
                        r = Math.floor(this.colliders[c].y / this.data.tileHeight);
                        c = Math.floor(this.colliders[c].x / this.data.tileWidth);
                        returnMatrix[r][c] = 1;
                    }
                }
                for (var d = 0; d < this.pathfindingDeadZones.length; d++) {
                    r = Math.floor(this.pathfindingDeadZones[d].y / this.data.tileHeight);
                    c = Math.floor(this.pathfindingDeadZones[d].x / this.data.tileWidth);
                    returnMatrix[r][c] = 1;
                }
            }
            return returnMatrix;
        };
        Map.prototype.GetLayer = function (_name) {
            var i = 0;
            while (i < this.layers.length && this.layers[i].data.name != _name)
                i++;
            return this.layers[i];
        };
        Map.prototype.AddToLayer = function (_sprite, _layer, _isCollider, _isLazyCollider, _isPathfindingDeadZone) {
            var layer = this.GetLayer(_layer);
            layer.container.add(_sprite);
            if (_isCollider)
                this.AddCollider(_sprite, _isLazyCollider);
            if (_isPathfindingDeadZone) {
                this.pathfindingDeadZones.push(new Phaser.Sprite(this.game, _sprite.x - this.data.tileWidth, _sprite.y - this.data.tileHeight));
                this.pathfindingDeadZones.push(new Phaser.Sprite(this.game, _sprite.x, _sprite.y - this.data.tileHeight));
                this.pathfindingDeadZones.push(new Phaser.Sprite(this.game, _sprite.x + this.data.tileWidth, _sprite.y - this.data.tileHeight));
                this.pathfindingDeadZones.push(new Phaser.Sprite(this.game, _sprite.x - this.data.tileWidth, _sprite.y));
                this.pathfindingDeadZones.push(new Phaser.Sprite(this.game, _sprite.x + this.data.tileWidth, _sprite.y));
                this.pathfindingDeadZones.push(new Phaser.Sprite(this.game, _sprite.x - this.data.tileWidth, _sprite.y + this.data.tileHeight));
                this.pathfindingDeadZones.push(new Phaser.Sprite(this.game, _sprite.x, _sprite.y + this.data.tileHeight));
                this.pathfindingDeadZones.push(new Phaser.Sprite(this.game, _sprite.x + this.data.tileWidth, _sprite.y + this.data.tileHeight));
            }
        };
        Map.prototype.ClearPathfindingDeadzones = function () {
            this.pathfindingDeadZones = [];
        };
        Map.prototype.UpdateChunksAround = function (_cR, _cC) {
            for (var r = 0; r < this.chunks.length; r++)
                for (var c = 0; c < this.chunks[r].length; c++)
                    this.chunks[r][c].PrematureDeactivation();
            this.centerChunk = this.chunks[_cR] && this.chunks[_cR][_cC];
            if (this.centerChunk) {
                this.centerChunk.Activate();
                this.centerChunk.ActivateAdjacent();
            }
            for (var r = 0; r < this.chunks.length; r++)
                for (var c = 0; c < this.chunks[r].length; c++)
                    this.chunks[r][c].DeactivationCheck();
        };
        Map.prototype.IsCollidingWithSimmilarTrigger = function (_collider, _trigger, _chunk, _propagating) {
            var c = 0;
            while (c < _chunk.triggers.length && (_chunk.triggers[c].id != _trigger.id || !_chunk.triggers[c].HasCollider(_collider)))
                c++;
            if (c < _chunk.triggers.length)
                return true;
            else if (!_propagating) {
                var a = 0;
                while (a < _chunk.adjacentCollisionChunks.length && !this.IsCollidingWithSimmilarTrigger(_collider, _trigger, _chunk.adjacentCollisionChunks[a], true))
                    a++;
                return a < _chunk.adjacentCollisionChunks.length;
            }
        };
        Map.prototype.AddCollider = function (_collider, _isLazyCollider) {
            // Lazy colliders only check collision
            // with adjacent collision chunks 
            if (_isLazyCollider)
                this.lazyColliders.push(_collider);
            else
                this.colliders.push(_collider);
            this.quadtree.insert(_collider);
        };
        Map.prototype.RemoveCollider = function (_collider) {
            var c = 0;
            while (c < this.colliders.length && this.colliders[c] !== _collider)
                c++;
            if (c < this.colliders.length)
                this.colliders.splice(c, 1);
        };
        Map.prototype.UpdateCollisionOnChunk = function (_collider, _colliderIndex, _chunk) {
            // Check collision between collider and tiles.
            var collider;
            for (var c = 0; c < _chunk.colliders.length; c++) {
                collider = _chunk.colliders[c];
                if (this.game.physics.arcade.collide(_collider, collider))
                    this.OnCollision(_collider, collider);
                this.collisionChecks++;
            }
            var trigger;
            for (var t = 0; t < _chunk.triggers.length; t++) {
                this.triggerChecks++;
                trigger = _chunk.triggers[t];
                if (this.game.physics.arcade.intersects(_collider.body, trigger.body)) {
                    if (!trigger.HasCollider(_collider)) {
                        // A collider will only enter a trigger
                        // if it is not colliding with any other simmilar triggers
                        if (!this.IsCollidingWithSimmilarTrigger(_collider, trigger, _chunk))
                            this.OnTriggerEnter(trigger, _collider);
                        trigger.AddCollider(_collider);
                    }
                }
                else if (trigger.HasCollider(_collider)) {
                    trigger.RemoveCollider(_collider);
                    // A collider will only leave a trigger
                    // if it no longer collides with any other simmilar triggers
                    if (!this.IsCollidingWithSimmilarTrigger(_collider, trigger, _chunk)) {
                        this.OnTriggerLeave(trigger, _collider);
                    }
                }
            }
        };
        Map.prototype.UpdateCollisions = function () {
            // Sort colliders Z index
            this.colliders.sort(function (_a, _b) {
                if (_a.world.y > _b.world.y) {
                    _a.bringToTop();
                    return 1;
                }
                else
                    return 0;
            });
            var collider;
            // Check collision between 'Hard' colliders
            for (var i = 0; i < this.colliders.length; i++) {
                collider = this.colliders[i];
                // Check collision between added Collider <-> Collider
                for (var c = 0; c < this.colliders.length; c++) {
                    if (c != i && this.game.physics.arcade.collide(collider, this.colliders[c]))
                        this.OnCollision(collider, this.colliders[c]);
                    this.collisionChecks++;
                }
                // Check collision between added Collider <-> Map.Collider
                var obstacles;
                var obstacle;
                obstacles = this.quadtree.retrieve(collider);
                for (var o = 0; o < obstacles.length; o++) {
                    obstacle = obstacles[o];
                    if (this.game.physics.arcade.collide(collider, obstacle))
                        this.OnCollision(collider, obstacle);
                    this.collisionChecks++;
                }
            }
            // Check collision for 'Lazy' colliders
            if (this.centerChunk)
                for (var l = 0; l < this.lazyColliders.length; l++) {
                    collider = this.lazyColliders[l];
                    this.UpdateCollisionOnChunk(collider, l, this.centerChunk);
                    for (var a = 0; a < this.centerChunk.adjacentCollisionChunks.length; a++)
                        this.UpdateCollisionOnChunk(collider, l, this.centerChunk.adjacentCollisionChunks[a]);
                }
        };
        Map.prototype.UpdateMap = function () {
            var camera_centerX = this.game.camera.x + (this.game.camera.width / 2);
            var camera_centerY = this.game.camera.y + (this.game.camera.height / 2);
            var camera_chunkRow = Math.floor(camera_centerY / this.data.chunkHeight);
            var camera_chunkColumn = Math.floor(camera_centerX / this.data.chunkWidth);
            if (camera_chunkRow != this.cameraChunkRow || camera_chunkColumn != this.cameraChunkColumn) {
                this.cameraChunkRow = camera_chunkRow;
                this.cameraChunkColumn = camera_chunkColumn;
                this.UpdateChunksAround(this.cameraChunkRow, this.cameraChunkColumn);
            }
            this.UpdateCollisions();
        };
        Map.prototype.CacheNextAdjacentGraphicalChunk = function (_r, _c, _callback) {
            var map = this;
            map.progress += 1;
            this.chunks[_r][_c].CacheAdjacentGraphicalChunks(function () {
                if (_c + 1 >= map.chunks[_r].length) {
                    _r++;
                    _c = 0;
                }
                else
                    _c++;
                if (map.progressCallback && _c == 0) {
                    setTimeout(function () {
                        map.progressCallback((map.progress * 100) / map.progressTotal, map.progressCallbackContext);
                        if (_r < map.chunks.length)
                            map.CacheNextAdjacentGraphicalChunk(_r, _c, _callback);
                        else
                            _callback();
                    }, 1);
                }
                else if (_r < map.chunks.length)
                    map.CacheNextAdjacentGraphicalChunk(_r, _c, _callback);
                else
                    _callback();
            });
        };
        Map.prototype.CacheAdjacentGraphicalChunks = function (_callback, _callbackContext) {
            this.CacheNextAdjacentGraphicalChunk(0, 0, function () {
                if (_callback)
                    _callback(_callbackContext);
            });
        };
        Map.prototype.CacheNextAdjacentCollisionChunk = function (_r, _c) {
            var map = this;
            map.progress += 1;
            this.chunks[_r][_c].CacheAdjacentCollisionChunks(function () {
                if (_c + 1 >= map.chunks[_r].length) {
                    _r++;
                    _c = 0;
                }
                else
                    _c++;
                if (map.progressCallback && _c == 0) {
                    setTimeout(function () {
                        map.progressCallback((map.progress * 100) / map.progressTotal, map.progressCallbackContext);
                        if (_r < map.chunks.length)
                            map.CacheNextAdjacentCollisionChunk(_r, _c);
                    }, 1);
                }
                else if (_r < map.chunks.length)
                    map.CacheNextAdjacentCollisionChunk(_r, _c);
            });
        };
        Map.prototype.CacheAdjacentCollisionChunks = function () {
            this.CacheNextAdjacentCollisionChunk(0, 0);
        };
        Map.prototype.LoadCachedGraphicalChunks = function (_adjacentChunksCache) {
            for (var r = 0; r < _adjacentChunksCache.length; r++) {
                for (var c = 0; c < _adjacentChunksCache[r].length; c++) {
                    this.chunks[r][c].adjacentGraphicalChunks = [];
                    for (var a = 0; a < _adjacentChunksCache[r][c].length; a++) {
                        this.chunks[r][c].adjacentGraphicalChunks.push(this.chunks[_adjacentChunksCache[r][c][a][0]][_adjacentChunksCache[r][c][a][1]]);
                    }
                }
            }
        };
        Map.prototype.GetCachedGraphicalChunks = function () {
            var returnChunks = [];
            var chunk;
            var adjacentChunk;
            for (var r = 0; r < this.chunks.length; r++) {
                returnChunks[r] = [];
                for (var c = 0; c < this.chunks[r].length; c++) {
                    chunk = this.chunks[r][c];
                    returnChunks[r][c] = [];
                    for (var a = 0; a < chunk.adjacentGraphicalChunks.length; a++) {
                        adjacentChunk = chunk.adjacentGraphicalChunks[a];
                        returnChunks[r][c][a] = [adjacentChunk.coord.row, adjacentChunk.coord.column];
                    }
                }
            }
            return returnChunks;
        };
        Map.prototype.GetChunk = function (_x, _y) {
            var chunkR = Math.floor(_y / (this.data.chunkTileRows * this.data.tileHeight));
            var chunkC = Math.floor(_x / (this.data.chunkTileColumns * this.data.tileWidth));
            return this.chunks[chunkR][chunkC];
        };
        Map.prototype.AddChunkCollider = function (_collider) {
            this.GetChunk(_collider.x, _collider.y).AddCollider(_collider);
        };
        Map.prototype.RemoveChunkCollider = function (_collider) {
            this.GetChunk(_collider.x, _collider.y).RemoveCollider(_collider);
        };
        Map.prototype.GetTilesOnLayer = function (_layerName) {
            var returnTiles = [];
            var chunk;
            var foundLayer = false;
            for (var r = 0; r < this.chunks.length; r++) {
                for (var c = 0; c < this.chunks[r].length; c++) {
                    chunk = this.chunks[r][c];
                    // Find the layer
                    var l = 0;
                    while (l < chunk.layers.length && chunk.layers[l].layer.name != _layerName)
                        l++;
                    if (l < chunk.layers.length) {
                        foundLayer = true;
                        var layer = chunk.layers[l];
                        for (var tR = 0; tR < layer.tiles.length; tR++)
                            if (layer.tiles[tR])
                                for (var tC = 0; tC < layer.tiles[tR].length; tC++)
                                    if (layer.tiles[tR][tC])
                                        returnTiles.push(layer.tiles[tR][tC]);
                    }
                }
            }
            if (!foundLayer)
                console.warn("TiledChunks.Map: Could not find any " + _layerName + " named layers");
            return returnTiles;
        };
        Map.prototype.GetTilesOnLayerByProperty = function (_layer, _property, _value) {
            var tiles = this.GetTilesOnLayer(_layer);
            var tile;
            var tileset;
            var returnTiles = [];
            for (var t = 0; t < tiles.length; t++) {
                tile = tiles[t];
                tileset = this.data.GetTilesetForId(tile.data.id);
                if (tileset.GetPropertyValueFromId(tile.data.id, _property) == _value)
                    returnTiles.push(tile);
            }
            return returnTiles;
        };
        Map.prototype.TileInTileArray = function (_tile, _tiles) {
            var t = 0;
            while (t < _tiles.length && _tiles[t] != _tile)
                t++;
            return t < _tiles.length;
        };
        Map.prototype.GetExactTileOnLayer = function (_tile, _layer) {
            var tiles = this.GetTilesOnLayer(_layer);
            if (tiles.length > 0) {
                var t = 0;
                while (t < tiles.length && tiles[t].key != _tile.key)
                    t++;
                if (t < tiles.length)
                    return tiles[t];
            }
            return null;
        };
        Map.prototype.GetNearestTileOnLayer = function (_point, _layer) {
            var tiles = this.GetTilesOnLayer(_layer);
            if (tiles.length > 0) {
                var nearest = null;
                var nearestDistance;
                var calculatedDistance;
                var tile;
                for (var t = 0; t < tiles.length; t++) {
                    tile = tiles[t];
                    calculatedDistance = _point.distance(tile.point);
                    if (!nearestDistance || calculatedDistance < nearestDistance) {
                        nearest = tile;
                        nearestDistance = calculatedDistance;
                    }
                }
                return nearest;
            }
            return null;
        };
        Map.prototype.GetNearestTileOnLayerByProperty = function (_point, _layer, _property, _value, _exceptions) {
            var tiles = this.GetTilesOnLayerByProperty(_layer, _property, _value);
            if (tiles.length > 0) {
                var nearest = null;
                var nearestDistance;
                var calculatedDistance;
                var tile;
                for (var t = 0; t < tiles.length; t++) {
                    tile = tiles[t];
                    if (!_exceptions || !this.TileInTileArray(tile, _exceptions)) {
                        calculatedDistance = _point.distance(tile.point);
                        if (!nearestDistance || calculatedDistance < nearestDistance) {
                            nearest = tile;
                            nearestDistance = calculatedDistance;
                        }
                    }
                }
                return nearest;
            }
            return null;
        };
        Map.prototype.UpdatePathfinding = function () {
            this.pathfinding.setGrid(this.GetCollisionMatrix());
            this.ClearPathfindingDeadzones();
        };
        Map.MAP_EVENT_ON_COLLISION = 1;
        Map.MAP_EVENT_ON_TRIGGER_ENTER = 2;
        Map.MAP_EVENT_ON_TRIGGER_LEAVE = 3;
        return Map;
    }());
    TiledChunks.Map = Map;
})(TiledChunks || (TiledChunks = {}));
var TiledChunks;
(function (TiledChunks) {
    var MapData = (function () {
        function MapData(_worldWidth, _worldHeight, _viewportWidth, _viewportHeight, _chunkTileRows, _chunkTileColumns, _tileWidth, _tileHeight, _tiledMap, _usedLayers, _tilesets, _fixedMap) {
            this.worldWidth = _worldWidth;
            this.worldHeight = _worldHeight;
            this.viewportWidth = _viewportWidth;
            this.viewportHeight = _viewportHeight;
            this.tileWidth = _tileWidth;
            this.tileHeight = _tileHeight;
            this.chunkTileRows = _chunkTileRows;
            this.chunkTileColumns = _chunkTileColumns;
            this.chunkWidth = _chunkTileColumns * _tileWidth;
            this.chunkHeight = _chunkTileRows * _tileHeight;
            this.chunkColumns = this.worldWidth / this.chunkWidth;
            this.chunkRows = this.worldHeight / this.chunkHeight;
            this.tileCountX = this.chunkColumns * this.chunkTileColumns;
            this.tileCountY = this.chunkRows * this.chunkTileRows;
            this.fixedMap = _fixedMap;
            // Now that we now everything about the map/chunk/tiles/viewport
            // We must calculate how many chunks we have to render 
            this.CalculateNeededChunkCacheSizes();
            // Convert Tiled's one dimensional array into a matrix
            this.layers = _usedLayers;
            var uL;
            var tiles;
            for (var l = 0; l < _tiledMap["layers"].length; l++) {
                for (var u = 0; u < this.layers.length; u++) {
                    uL = this.layers[u];
                    if (uL.name == _tiledMap["layers"][l]["name"]) {
                        uL.SetTiles(this.ListToMatrix(_tiledMap["layers"][l]["data"]));
                    }
                }
            }
            // Tileset handling
            this.tilesets = _tilesets;
            var foundTileset;
            var dummyTileset;
            for (var t = 0; t < _tiledMap["tilesets"].length; t++) {
                foundTileset = false;
                var from = _tiledMap["tilesets"][t]["firstgid"];
                var count = _tiledMap["tilesets"][t]["tilecount"];
                var customProperties = _tiledMap["tilesets"][t]["tileproperties"];
                for (var s = 0; s < this.tilesets.length; s++) {
                    if (this.tilesets[s].name == _tiledMap["tilesets"][t]["name"]) {
                        foundTileset = true;
                        this.tilesets[s].fromID = from;
                        this.tilesets[s].toID = from + count;
                        this.tilesets[s].properties = customProperties;
                    }
                }
                if (!foundTileset) {
                    dummyTileset = new TiledChunks.Tileset(_tiledMap["tilesets"][t]["name"], null);
                    dummyTileset.fromID = from;
                    dummyTileset.toID = from + count;
                    dummyTileset.properties = customProperties;
                    this.tilesets.push(dummyTileset);
                }
            }
            foundTileset = null;
            dummyTileset = null;
        }
        MapData.prototype.ListToMatrix = function (list) {
            var matrix = [], i, k;
            for (i = 0, k = -1; i < list.length; i++) {
                if (i % this.tileCountX === 0) {
                    k++;
                    matrix[k] = [];
                }
                matrix[k].push(list[i]);
            }
            return matrix;
        };
        MapData.prototype.GetTextureKeyForId = function (_tileID) {
            return this.GetTilesetForId(_tileID).textureKey;
        };
        MapData.prototype.GetTilesetForId = function (_tileID) {
            var i = 0;
            while (i < this.tilesets.length && !(this.tilesets[i].fromID <= _tileID && _tileID < this.tilesets[i].toID))
                i++;
            if (i < this.tilesets.length)
                return this.tilesets[i];
            else {
            }
        };
        MapData.prototype.GetTileset = function (_name) {
            var i = 0;
            while (i < this.tilesets.length && this.tilesets[i].name != _name)
                i++;
            if (i < this.tilesets.length)
                return this.tilesets[i];
        };
        MapData.prototype.GetFrameForId = function (_tileID) {
            var tileSet = this.GetTilesetForId(_tileID);
            if (tileSet)
                return tileSet.GetFrameFromId(_tileID);
            else
                return -1;
        };
        MapData.prototype.CalculateNeededChunkCacheSizes = function () {
            // Find the chunks first biggest multiply 
            var foundWidth = 0;
            var foundHeight = 0;
            var needWidth = (this.viewportWidth - this.chunkWidth) / 4;
            var needHeight = (this.viewportHeight - this.chunkHeight) / 4;
            while (needWidth > foundWidth)
                foundWidth += this.chunkWidth;
            while (needHeight > foundHeight)
                foundHeight += this.chunkHeight;
            this.chunkNeedCacheHorizontal = Math.ceil(foundWidth / this.chunkWidth);
            this.chunkNeedCacheVertical = Math.ceil(foundHeight / this.chunkHeight);
        };
        return MapData;
    }());
    TiledChunks.MapData = MapData;
})(TiledChunks || (TiledChunks = {}));
var TiledChunks;
(function (TiledChunks) {
    var MapLayer = (function () {
        function MapLayer(_container, _data) {
            this.container = _container;
            this.data = _data;
        }
        return MapLayer;
    }());
    TiledChunks.MapLayer = MapLayer;
})(TiledChunks || (TiledChunks = {}));
var TiledChunks;
(function (TiledChunks) {
    var MapListener = (function () {
        function MapListener(_sprite, _event, _callback, _callbackContext) {
            this.map_listener_sprite = _sprite;
            this.map_listener_event = _event;
            this.map_listener_callback = _callback;
            this.map_listener_callback_context = _callbackContext;
        }
        MapListener.prototype.GetSprite = function () {
            return this.map_listener_sprite;
        };
        MapListener.prototype.GetEvent = function () {
            return this.map_listener_event;
        };
        MapListener.prototype.GetCallback = function () {
            return this.map_listener_callback;
        };
        MapListener.prototype.GetCallbackContext = function () {
            return this.map_listener_callback_context;
        };
        return MapListener;
    }());
    TiledChunks.MapListener = MapListener;
})(TiledChunks || (TiledChunks = {}));
var TiledChunks;
(function (TiledChunks) {
    var Tile = (function () {
        function Tile(_chunkLayer, _offsetX, _offsetY, _data) {
            this.chunkLayer = _chunkLayer;
            this.data = _data;
            this.chunkColumn = _offsetX;
            this.chunkRow = _offsetY;
            this.offsetX = _offsetX;
            this.offsetY = _offsetY;
            var tileX = _chunkLayer.chunk.x + (_offsetX * this.chunkLayer.chunk.map.data.tileWidth);
            var tileY = _chunkLayer.chunk.y + (_offsetY * this.chunkLayer.chunk.map.data.tileHeight);
            this.point = new Phaser.Point(tileX, tileY);
            this.key = tileX + "/" + tileY;
            this.sprite = new Phaser.Sprite(this.chunkLayer.chunk.map.game, tileX, tileY);
            this.sprite.name = "Tile" + this.key;
            tileX = null;
            tileY = null;
            this.data.textureFrame = this.chunkLayer.chunk.map.data.GetFrameForId(this.data.id);
            this.data.textureKey = this.chunkLayer.chunk.map.data.GetTextureKeyForId(this.data.id);
            this.sprite.loadTexture(this.data.textureKey, this.data.textureFrame);
            Tile.tiles++;
        }
        Tile.prototype.DrawTile = function (_chunkLayer) {
            _chunkLayer.mapLayer.container.add(this.sprite);
        };
        Tile.prototype.EraseTile = function (_chunkLayer) {
            _chunkLayer.mapLayer.container.remove(this.sprite);
        };
        Tile.prototype.RemoveFromWorld = function () {
            this.chunkLayer.tiles[this.chunkRow][this.chunkColumn] = null;
            this.EraseTile(this.chunkLayer);
            if (this.chunkLayer.layer.isCollisionLayer) {
                var collider = this.chunkLayer.chunk.GetColliderByTile(this);
                if (collider)
                    this.chunkLayer.chunk.RemoveCollider(collider);
            }
        };
        Tile.tiles = 0;
        return Tile;
    }());
    TiledChunks.Tile = Tile;
})(TiledChunks || (TiledChunks = {}));
var TiledChunks;
(function (TiledChunks) {
    var TileData = (function () {
        function TileData(_id) {
            this.id = _id;
        }
        return TileData;
    }());
    TiledChunks.TileData = TileData;
})(TiledChunks || (TiledChunks = {}));
var TiledChunks;
(function (TiledChunks) {
    var Tileset = (function () {
        function Tileset(_name, _textureKey) {
            this.name = _name;
            this.textureKey = _textureKey;
        }
        Tileset.prototype.GetFrameFromId = function (_id) {
            return _id - this.fromID;
        };
        Tileset.prototype.GetPropertyValueFromId = function (_id, _property) {
            var properties = this.GetPropertiesFromId(_id);
            return properties && properties[_property];
        };
        Tileset.prototype.GetPropertiesFromId = function (_id) {
            return this.properties && this.properties[this.GetFrameFromId(_id)];
        };
        return Tileset;
    }());
    TiledChunks.Tileset = Tileset;
})(TiledChunks || (TiledChunks = {}));
var TiledChunks;
(function (TiledChunks) {
    var Trigger = (function (_super) {
        __extends(Trigger, _super);
        function Trigger(_game, _id, _x, _y) {
            _super.call(this, _game, _x, _y);
            this.colliders = [];
            this.id = _id;
            this.key = "TriggerSprite" + _x + "/" + _y;
        }
        Trigger.prototype.AddCollider = function (_collider) {
            this.colliders.push(_collider);
        };
        Trigger.prototype.HasCollider = function (_collider) {
            var c = 0;
            while (c < this.colliders.length && this.colliders[c] != _collider)
                c++;
            return c < this.colliders.length;
        };
        Trigger.prototype.RemoveCollider = function (_collider) {
            var c = 0;
            while (c < this.colliders.length && this.colliders[c] != _collider)
                c++;
            if (c < this.colliders.length)
                this.colliders.splice(c, 1);
        };
        return Trigger;
    }(Phaser.Sprite));
    TiledChunks.Trigger = Trigger;
})(TiledChunks || (TiledChunks = {}));
//# sourceMappingURL=tiledchunks.js.map