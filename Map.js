var TiledChunks;
(function (TiledChunks) {
    var Map = (function () {
        function Map(_game, _data) {
            this.game = _game;
            this.data = _data;
            this.container = new Phaser.Group(_game);
            this.colliders = [];
            this.collisionChecks = 0;
            this.triggerChecks = 0;
            this.chunksDrawn = 0;
            this.listeners = [];
            this.layers = [];
            var layerContainer;
            var layerData;
            for (var l = 0; l < this.data.layers.length; l++) {
                layerData = this.data.layers[l];
                if (layerData.batch)
                    layerContainer = new Phaser.SpriteBatch(this.game, this.container, layerData.name);
                else
                    layerContainer = new Phaser.Group(this.game, this.container, layerData.name);
                this.layers.push(new TiledChunks.MapLayer(layerContainer, layerData));
            }
            this.chunks = [];
            var chunk;
            for (var r = 0; r < this.data.chunkRows; r++) {
                this.chunks[r] = [];
                for (var c = 0; c < this.data.chunkColumns; c++) {
                    chunk = new TiledChunks.Chunk(this, r, c);
                    this.chunks[r][c] = chunk;
                }
            }
            this.LoadCachedChunks(false);
            this.UpdateMap();
            console.log("Created chunks: " + TiledChunks.Chunk.chunks);
            console.log("Created tiles: " + TiledChunks.Tile.tiles);
        }
        Map.prototype.AddListener = function (_sprite, _event, _callback) {
            this.listeners.push(new TiledChunks.MapListener(_sprite, _event, _callback));
        };
        Map.prototype.RemoveListener = function (_event) {
        };
        Map.prototype.OnTriggerEnter = function (_trigger, _collider) {
            for (var l = 0; l < this.listeners.length; l++)
                if (this.listeners[l].event == "OnTriggerEnter" && this.listeners[l].sprite.name == _collider.name)
                    this.listeners[l].callback(_trigger);
        };
        Map.prototype.OnTriggerLeave = function (_trigger, _collider) {
            for (var l = 0; l < this.listeners.length; l++)
                if (this.listeners[l].event == "OnTriggerLeave" && this.listeners[l].sprite.name == _collider.name)
                    this.listeners[l].callback(_trigger);
        };
        Map.prototype.GetLayer = function (_name) {
            var i = 0;
            while (i < this.layers.length && this.layers[i].data.name != _name)
                i++;
            return this.layers[i];
        };
        Map.prototype.AddToLayer = function (_sprite, _layer, _isCollider) {
            var layer = this.GetLayer(_layer);
            layer.container.add(_sprite);
            if (_isCollider)
                this.AddCollider(_sprite);
        };
        Map.prototype.UpdateChunksAround = function (_cR, _cC) {
            for (var r = 0; r < this.chunks.length; r++)
                for (var c = 0; c < this.chunks[r].length; c++)
                    this.chunks[r][c].PrematureDeactivation();
            this.centerChunk = this.chunks[_cR][_cC];
            this.centerChunk.Activate();
            this.centerChunk.ActivateAdjacent();
            for (var r = 0; r < this.chunks.length; r++)
                for (var c = 0; c < this.chunks[r].length; c++)
                    this.chunks[r][c].DeactivationCheck();
        };
        Map.prototype.IsCollidingWithSimmilarTrigger = function (_collider, _trigger, _chunk, _propagating) {
            var c = 0;
            while (c < _chunk.triggers.length && (_chunk.triggers[c] == _trigger || !_chunk.triggers[c].HasCollider(_collider)))
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
        Map.prototype.AddCollider = function (_collider) {
            this.colliders.push(_collider);
        };
        Map.prototype.RemoveCollider = function (_collider) {
            var c = 0;
            while (c < this.colliders.length && this.colliders[c] != _collider)
                c++;
            if (c < this.colliders.length)
                this.colliders.splice(c, 1);
        };
        Map.prototype.UpdateCollisionOnChunk = function (_chunk) {
            var collider;
            var tile;
            var trigger;
            for (var i = 0; i < this.colliders.length; i++) {
                collider = this.colliders[i];
                for (var c = 0; c < _chunk.colliders.length; c++) {
                    tile = _chunk.colliders[c];
                    this.game.physics.arcade.collide(collider, tile);
                    this.collisionChecks++;
                }
                for (var t = 0; t < _chunk.triggers.length; t++) {
                    this.triggerChecks++;
                    trigger = _chunk.triggers[t];
                    if (this.game.physics.arcade.overlap(collider, trigger)) {
                        if (!trigger.HasCollider(collider)) {
                            trigger.AddCollider(collider);
                            if (!this.IsCollidingWithSimmilarTrigger(collider, trigger, _chunk))
                                this.OnTriggerEnter(trigger, collider);
                        }
                    }
                    else if (trigger.HasCollider(collider)) {
                        trigger.RemoveCollider(collider);
                        if (!this.IsCollidingWithSimmilarTrigger(collider, trigger, _chunk))
                            this.OnTriggerLeave(trigger, collider);
                    }
                }
            }
        };
        Map.prototype.UpdateCollisions = function () {
            this.UpdateCollisionOnChunk(this.centerChunk);
            if (this.centerChunk.adjacentCollisionChunks)
                for (var a = 0; a < this.centerChunk.adjacentCollisionChunks.length; a++)
                    this.UpdateCollisionOnChunk(this.centerChunk.adjacentCollisionChunks[a]);
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
        Map.prototype.CacheAdjacentChunks = function (_cacheVisual) {
            for (var r = 0; r < this.chunks.length; r++) {
                for (var c = 0; c < this.chunks[r].length; c++) {
                    this.chunks[r][c].CacheAdjacentChunks(this.data.chunkNeedCacheHorizontal, this.data.chunkNeedCacheVertical, _cacheVisual);
                }
            }
            if (_cacheVisual)
                this.OutputCachedChunks();
        };
        Map.prototype.ResizeViewport = function (_newWidth, _newHeight) {
            this.data.viewportWidth = _newWidth;
            this.data.viewportHeight = _newHeight;
            this.data.CalculateNeededChunkCacheSizes();
            this.LoadCachedChunks(false);
        };
        Map.prototype.LoadCachedChunks = function (_cacheNowIfNotFound) {
            var ref = this;
            var jsonLoader = new Phaser.Loader(this.game);
            jsonLoader.json("adjacentChunksCache", "assets/adjacent_caches/" + this.data.viewportWidth + "x" + this.data.viewportHeight + "x" + this.data.chunkNeedCacheHorizontal + "x" + this.data.chunkNeedCacheVertical + "x" + this.data.chunkTileRows + "x" + this.data.chunkTileColumns + ".json");
            jsonLoader.onLoadComplete.addOnce(function () {
                var cacheJSON = this.game.cache.getJSON("adjacentChunksCache");
                if (cacheJSON) {
                    var adjacentChunksCache = cacheJSON["chunks"];
                    for (var r = 0; r < adjacentChunksCache.length; r++) {
                        for (var c = 0; c < adjacentChunksCache[r].length; c++) {
                            ref.chunks[r][c].adjacentGraphicalChunks = [];
                            ref.chunks[r][c].CacheAdjacentCollisionChunks();
                            for (var a = 0; a < adjacentChunksCache[r][c].length; a++) {
                                ref.chunks[r][c].adjacentGraphicalChunks.push(ref.chunks[adjacentChunksCache[r][c][a][0]][adjacentChunksCache[r][c][a][1]]);
                            }
                        }
                    }
                }
                else {
                    ref.CacheAdjacentChunks(_cacheNowIfNotFound);
                }
            }, this);
            jsonLoader.start();
        };
        Map.prototype.OutputCachedChunks = function () {
            var output = "{ \"chunkTileRows\": " + this.data.chunkTileRows + ", \"chunkTileColumns\": " + this.data.chunkTileColumns + ", \"chunks\":[";
            var chunk;
            var adjacentChunk;
            for (var r = 0; r < this.chunks.length; r++) {
                output += "[";
                for (var c = 0; c < this.chunks[r].length; c++) {
                    chunk = this.chunks[r][c];
                    output += "[";
                    for (var a = 0; a < chunk.adjacentGraphicalChunks.length; a++) {
                        adjacentChunk = chunk.adjacentGraphicalChunks[a];
                        output += "[" + adjacentChunk.coord.row + "," + adjacentChunk.coord.column + "]";
                        if (a + 1 < chunk.adjacentGraphicalChunks.length)
                            output += ",";
                    }
                    output += "]";
                    if (c + 1 < this.chunks[r].length)
                        output += ",";
                }
                output += "]";
                if (r + 1 < this.chunks.length)
                    output += ",";
            }
            prompt("Adjacent Chunks CACHE", output + "]}");
        };
        Map.prototype.GetTilesOnLayer = function (_layerName) {
            var returnTiles = [];
            var chunk;
            var foundLayer = false;
            for (var r = 0; r < this.chunks.length; r++) {
                for (var c = 0; c < this.chunks[r].length; c++) {
                    chunk = this.chunks[r][c];
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
                console.log("Could not find any " + _layerName + " named layers");
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
        return Map;
    })();
    TiledChunks.Map = Map;
})(TiledChunks || (TiledChunks = {}));
