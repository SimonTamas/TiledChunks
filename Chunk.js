var TiledChunks;
(function (TiledChunks) {
    var Chunk = (function () {
        function Chunk(_map, _row, _column) {
            this.map = _map;
            this.row = _row;
            this.column = _column;
            this.colliders = [];
            this.triggers = [];
            this.x = this.column * this.map.data.chunkWidth;
            this.y = this.row * this.map.data.chunkHeight;
            this.coord = new TiledChunks.ChunkCoord(this.row, this.column);
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
            layerData = null;
            Chunk.chunks++;
        }
        Chunk.prototype.PrematureDeactivation = function () {
            this.deactivating = true;
        };
        Chunk.prototype.DeactivationCheck = function () {
            if (this.deactivating)
                this.Deactivate();
        };
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
                this.CacheAdjacentGraphicalChunks(this.map.data.chunkNeedCacheHorizontal, this.map.data.chunkNeedCacheVertical);
            for (var a = 0; a < this.adjacentGraphicalChunks.length; a++)
                this.adjacentGraphicalChunks[a].Activate();
        };
        Chunk.prototype.CacheAdjacentGraphicalChunks = function (_depthX, _depthY) {
            this.adjacentGraphicalChunks = this.GetAdjacentChunks(_depthX, _depthY);
        };
        Chunk.prototype.CacheAdjacentCollisionChunks = function () {
            this.adjacentCollisionChunks = this.GetAdjacentChunks(0, 0);
        };
        Chunk.prototype.CacheAdjacentChunks = function (_depthX, _depthY, _cacheGraphical) {
            if (_cacheGraphical)
                this.CacheAdjacentGraphicalChunks(_depthX, _depthY);
            this.CacheAdjacentCollisionChunks();
        };
        Chunk.MergeChunks = function (_chunks, _withChunks) {
            for (var c = 0; c < _withChunks.length; c++) {
                if (!TiledChunks.Chunk.ChunkInChunkArray(_withChunks[c], _chunks)) {
                    _chunks.push(_withChunks[c]);
                }
            }
            return _chunks;
        };
        Chunk.prototype.GetAdjacentChunks = function (_depthX, _depthY, _direction) {
            var adjacent = [];
            if (_direction != null) {
                switch (_direction) {
                    case 1:
                        if (this.row - 1 >= 0) {
                            adjacent.push(this.map.chunks[this.row - 1][this.column]);
                            if (_depthY > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row - 1][this.column].GetAdjacentChunks(_depthX, _depthY - 1, _direction)));
                        }
                        if (this.column + 1 < this.map.data.chunkColumns) {
                            adjacent.push(this.map.chunks[this.row][this.column + 1]);
                            if (_depthX > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row][this.column + 1].GetAdjacentChunks(_depthX - 1, _depthY, _direction)));
                        }
                        break;
                    case 2:
                        if (this.row - 1 >= 0) {
                            adjacent.push(this.map.chunks[this.row - 1][this.column]);
                            if (_depthY > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row - 1][this.column].GetAdjacentChunks(_depthX, _depthY - 1, _direction)));
                        }
                        if (this.column - 1 >= 0) {
                            adjacent.push(this.map.chunks[this.row][this.column - 1]);
                            if (_depthX > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row][this.column - 1].GetAdjacentChunks(_depthX - 1, _depthY, _direction)));
                        }
                        break;
                    case 3:
                        if (this.row + 1 < this.map.data.chunkRows) {
                            adjacent.push(this.map.chunks[this.row + 1][this.column]);
                            if (_depthY > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row + 1][this.column].GetAdjacentChunks(_depthX, _depthY - 1, _direction)));
                        }
                        if (this.column - 1 >= 0) {
                            adjacent.push(this.map.chunks[this.row][this.column - 1]);
                            if (_depthX > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row][this.column - 1].GetAdjacentChunks(_depthX - 1, _depthY, _direction)));
                        }
                        break;
                    case 4:
                        if (this.row + 1 < this.map.data.chunkRows) {
                            adjacent.push(this.map.chunks[this.row + 1][this.column]);
                            if (_depthY > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row + 1][this.column].GetAdjacentChunks(_depthX, _depthY - 1, _direction)));
                        }
                        if (this.column + 1 < this.map.data.chunkColumns) {
                            adjacent.push(this.map.chunks[this.row][this.column + 1]);
                            if (_depthX > 0)
                                TiledChunks.Chunk.MergeChunks(adjacent, (this.map.chunks[this.row][this.column + 1].GetAdjacentChunks(_depthX - 1, _depthY, _direction)));
                        }
                        break;
                }
            }
            else {
                for (var d = 1; d < 5; d++) {
                    var chunksInDirection = this.GetAdjacentChunks(_depthX, _depthY, d);
                    for (var c = 0; c < chunksInDirection.length; c++) {
                        if (!TiledChunks.Chunk.ChunkInChunkArray(chunksInDirection[c], adjacent))
                            adjacent.push(chunksInDirection[c]);
                    }
                }
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
                                rect = new Phaser.Sprite(this.map.game, collisionX, collisionY);
                                this.colliders.push(rect);
                            }
                            this.map.game.physics.enable(rect, Phaser.Physics.ARCADE);
                            rect.body.setSize(this.map.data.tileWidth, this.map.data.tileHeight, 0, 0);
                            rect.body.immovable = true;
                            rect.name = this.map.data.GetTilesetForId(tileID).GetPropertyValueFromId(tileID, "name");
                        }
                    }
                }
            }
        };
        Chunk.chunks = 0;
        return Chunk;
    })();
    TiledChunks.Chunk = Chunk;
})(TiledChunks || (TiledChunks = {}));
