/**
 * Created by Oleg on 22/8/2016.
 */
import * as d3 from 'd3';
import jquery from 'jquery';

const imageBackgroundShiftX = 12;
const imageBackgroundShiftY = 20;
const imageBackgroundBottomShift = 8;

var svgDoors = [];

class DoorsController {
    /*@ngInject*/
    constructor($scope, $timeout, doorService) {
        this.$scope = $scope;
        this.$timeout = $timeout;
        this.doorService = doorService;
        this.newPhrase = '';
        this.uploadPhrase = '';
        this.categories = [];
        this.currentCategoryId = 0;
        this.colors = [];
        this.models = [];
        this.currentColorId = 0;

        this.svg = null;
        this.photoWidth = 0;
        this.photoHeight = 0;

        this.svgImageHeight = 0;
        this.svgImageWidth = 850;

        this.dataLoaded = false;
        this.dataLoadedModels = false;
        this.photoLoadProgress = 0;

    }

    $onInit() {
        this.doorService.getCategories().then((response) => {
            this.categories = response.data.categories;
            this.newPhrase = response.data.newPhrase;
            this.uploadPhrase = response.data.uploadPhrase;
        });

        this.$scope.fileUpload = (element) => {
            document.getElementById('photoBox').innerHTML = '';
            document.getElementById('svgRoot').innerHTML = '';
            svgDoors.length = 0;
            let file = element.files[0];
            // Validate image files.
            if (!file || !file.type.match('image.*')) {
                return false;
            }

            var reader = new FileReader();
            this.photoLoadProgress = 1;
            this.$scope.$apply();
            reader.onload = ((e) => {
                // Render picture
                document.getElementById('photoBox').innerHTML = ['<img class="thumb" src="', e.target.result, '"/>'].join('');
                let photo = document.querySelector('#photoBox img');
                //debugger;
                this.$timeout(() => {
                    this.photoWidth = photo.width;
                    this.photoHeight = photo.height;
                    const exif = EXIF.readFromBinaryFile(base64ToArrayBuffer(e.target.result));

                    const svgWidth = 850;
                    let photoWidth = svgWidth;
                    let rotate = 0;
                    let photoX = 0;
                    this.svgImageHeight = (svgWidth * this.photoHeight) / this.photoWidth;
                    let photoHeight = this.svgImageHeight;

                    if(exif.Orientation === 8) {
                        this.photoWidth = photo.height;
                        this.photoHeight = photo.width;
                        this.svgImageHeight = (svgWidth * this.photoHeight) / this.photoWidth;
                        rotate = -90;
                        photoX = this.svgImageHeight*-1;
                        photoHeight = svgWidth;
                        photoWidth = this.svgImageHeight;
                    }

                    this.svg = d3.select('#svgRoot').append('svg').attr('width', svgWidth + 'px').attr('height', this.svgImageHeight + 'px');
                    this.svg.append('svg:image')
                        .attr('xlink:href', e.target.result)
                        .attr('x', photoX)
                        .attr('y', 0)
                        .attr('width', photoWidth)
                        .attr('height', photoHeight)
                        .attr('transform', 'rotate(' + rotate + ')')
                        .attr('viewBox', '0, 0, ' + svgWidth + ',' + this.svgImageHeight);
                    this.photoLoadProgress = 0;
                }, 200);
            });

            // Read in the image file as a data URL.
            reader.readAsDataURL(file);
        };
    }

    openUpload() {
        document.getElementById('selectPhoto').click();
    }

    selectCategory(category) {
        this.dataLoaded = false;
        this.dataLoadedModels = false;
        this.currentCategoryId = category.categoryId;
        this.doorService.getColorsAndModels(category.categoryId).then((response) => {
            this.colors = response.data.colors;
            this.models = response.data.models;
            this.currentColorId = response.data.currentColorId;
            this.dataLoaded = true;
            this.dataLoadedModels = true;

            jquery('body').on('mouseenter', '.itemImage',function() {
                jquery('.cover', this).stop().animate({top:'105px'},{queue:false,duration:400});
            });

            jquery('body').on('mouseleave', '.itemImage',function() {
                jquery('.cover', this).stop().animate({top:'275px'},{queue:false,duration:300});
            });
        });
    }

    selectColor(color) {
        this.dataLoadedModels = false;
        this.currentColorId = color.id;
        this.doorService.getModels(this.currentCategoryId, this.currentColorId).then((response) => {
            this.models = response.data;
            this.dataLoadedModels = true;
        });
    }

    addToSvg(model) {
        if(!this.svg) {
            return false;
        }

        if(model.categoryId !== '6' || model.categoryId !== '7') {
            model.image = model.image.replace('small', 'original');
        }

        const doorModel = {
            x: 0,
            y: 0,
            scale: 1,
            image: model.image,
            clipPathId: model.id + model.categoryId + model.name,
            modelId: model.id,
            categoryId: model.categoryId,
            xd: imageBackgroundShiftX,
            yd: imageBackgroundShiftY,
            yp: imageBackgroundBottomShift,
            pictureXd: 20,
            pictureYd: 29,
            handleXd: 25,
            handleYd: 132,
            handleGXd: 21,
            hingeXd: 96,
            hingeYd: 52,
            hingeBottomYd: 198,
        };

        if(svgDoors.indexOf(doorModel.clipPathId) !== -1) {
            return false;
        }

        if(model.categoryId === '6' || model.categoryId === '7') {
            doorModel.box = model.box;
            doorModel.handle = model.handle;
            if(model.categoryId === '7') {
                doorModel.hinge = model.hinge;
            }
        }

        svgDoors.push(doorModel.clipPathId);

        const svgImageWidth = this.svgImageWidth;
        const svgImageHeight = this.svgImageHeight;

        const svgPane = this.svg;
        this.svg.selectAll('g')
            .data([doorModel], function (d) {
                return d.image;
            })
            .enter()
            .append('g')
            .attr('id', function (d) {
                return 'g'+d.clipPathId;
            })
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended))
            .each(function (d) {
                let data = d;

                d3.select(this).on('mouseover', function(d,i) {
                    d3.select(this).select('rect.resizer').style('opacity', '1');
                    d3.select(this).select('text.removeText').style('opacity', '1');
                })
                .on('mouseout', function(d,i) {
                    d3.select(this).select('rect.resizer').style('opacity', '0');
                    d3.select(this).select('text.removeText').style('opacity', '0');
                 });

                d3.select(this).append('clipPath')
                    .attr('id', function (d) {
                        return d.clipPathId;
                    })
                    /*.attr('clipPathUnits', 'objectBoundingBox')*/
                    .append('rect')
                    .attr('x', svgImageWidth / 2 - 125 / 2 + imageBackgroundShiftX)
                    .attr('y', svgImageHeight / 2 - 250 / 2 + imageBackgroundShiftY)
                    .attr('width', 103)
                    .attr('height', 222);

                if(d.categoryId !== '6' && d.categoryId !== '7') {
                    d3.select(this).append('svg:image')
                        .attr('xlink:href', function (d) {
                            return d.image;
                        })
                        .attr('x', svgImageWidth / 2 - 125 / 2)
                        .attr('y', svgImageHeight / 2 - 250 / 2)
                        .attr('width', 125)
                        .attr('height', 250)
                        .attr('class', 'single')
                        .style('cursor', 'move')
                        .attr('preserveAspectRatio', 'none')
                        .attr('clip-path', function (d) {
                            return 'url(#' + d.clipPathId + ')';
                        });
                }

                if(d.categoryId === '6' || model.categoryId === '7') {
                    d3.select(this).append('svg:image')
                        .attr('xlink:href', function (d) {
                            return d.image;
                        })
                        .attr('x', svgImageWidth / 2 - 125 / 2 + 20)
                        .attr('y', svgImageHeight / 2 - 250 / 2 + 29)
                        .attr('width', 86)
                        .attr('height', 212)
                        .attr('class', 'picture')
                        .style('cursor', 'move')
                        .attr('preserveAspectRatio', 'none');

                    d3.select(this).append('svg:image')
                        .attr('xlink:href', function (d) {
                            return d.box;
                        })
                        .attr('x', svgImageWidth / 2 - 125 / 2)
                        .attr('y', svgImageHeight / 2 - 250 / 2)
                        .attr('width', 125)
                        .attr('height', 250)
                        .attr('class', 'box')
                        .style('cursor', 'move')
                        .attr('preserveAspectRatio', 'none')
                        .attr('clip-path', function (d) {
                            return 'url(#' + d.clipPathId + ')';
                        });
                    if(d.categoryId === '6') {
                        d3.select(this).append('svg:image')
                            .attr('xlink:href', function (d) {
                                return d.handle;
                            })
                            .attr('x', svgImageWidth / 2 - 125 / 2 + 25)
                            .attr('y', svgImageHeight / 2 - 250 / 2 + 132)
                            .attr('width', 16)
                            .attr('height', 6)
                            .attr('class', 'handle')
                            .style('cursor', 'move')
                            .attr('preserveAspectRatio', 'none');
                    }
                    if(d.categoryId === '7') {
                        d3.select(this).append('svg:image')
                            .attr('xlink:href', function (d) {
                                return d.handle;
                            })
                            .attr('x', svgImageWidth / 2 - 125 / 2 + 21)
                            .attr('y', svgImageHeight / 2 - 250 / 2 + 132)
                            .attr('width', 16)
                            .attr('height', 6)
                            .attr('class', 'handle')
                            .style('cursor', 'move')
                            .attr('preserveAspectRatio', 'none');

                        d3.select(this).append('svg:image')
                            .attr('xlink:href', function (d) {
                                return d.hinge;
                            })
                            .attr('x', svgImageWidth / 2 - 125 / 2 + 96)
                            .attr('y', svgImageHeight / 2 - 250 / 2 + 52)
                            .attr('width', 16)
                            .attr('height', 6)
                            .attr('class', 'hingeTop')
                            .style('cursor', 'move')
                            .attr('preserveAspectRatio', 'none');

                        d3.select(this).append('svg:image')
                            .attr('xlink:href', function (d) {
                                return d.hinge;
                            })
                            .attr('x', svgImageWidth / 2 - 125 / 2 + 96)
                            .attr('y', svgImageHeight / 2 - 250 / 2 + 198)
                            .attr('width', 16)
                            .attr('height', 6)
                            .attr('class', 'hingeBottom')
                            .style('cursor', 'move')
                            .attr('preserveAspectRatio', 'none');
                    }
                }

                d3.select(this).append('rect')
                    .attr('x', svgImageWidth / 2 + 125 / 2 - 14)
                    .attr('y', svgImageHeight / 2 - 250 / 2 + 12)
                    .attr('class', 'resizer')
                    .attr('width', 11)
                    .attr('height', 11)
                    .attr('fill', '#DE5328')
                    .attr('stroke', 'black')
                    .style('cursor', 'nesw-resize')
                    .style('opacity', '0')
                    .attr('stroke-width', 1).call(d3.drag()
                    .on('drag', function (/*d*/) {
                        update(data, d3.select(this.parentNode));
                    }));

                d3.select(this).append('text')
                    .text('Удалить')
                    .attr('x', svgImageWidth / 2 - 125 / 2 + 14)
                    .attr('y', svgImageHeight / 2 - 250 / 2 + 19)
                    .attr('font-family', 'sans-serif')
                    .attr('font-size', '11px')
                    .attr('font-weight', 'bold')
                    .attr('class', 'removeText')
                    .attr('fill', 'red')
                    .style('cursor', 'pointer')
                    .style('opacity', '0')
                    .on('click', (d) => {
                        svgPane.select('g#g' + d.clipPathId).remove();
                        svgDoors = svgDoors.filter((item) => {
                            return (item !== d.clipPathId)? true : false;
                        });
                    });
            });

        function dragstarted(/*d*/) {
            d3.select(this).raise().classed('active', true);
        }

        function dragged(d) {
            d.x += d3.event.dx;
            d.y += d3.event.dy;
            d3.select(this).attr('transform', function (d) {
                return 'translate(' + [d.x, d.y] + ')';
            });
        }

        function dragended(/*d*/) {
            d3.select(this).classed('active', false);
        }

        function update(objectData, parent) {
            if(objectData.categoryId !== '6' && objectData.categoryId !== '7') {
                recalculatePositions(parent, 'image.single', true);
            }
            if(objectData.categoryId === '6') {
                const shift = recalculatePositions(parent, 'image.box', true);
                if(shift) {
                    recalculatePositions(parent, 'image.picture', false, shift, objectData);
                    recalculatePositions(parent, 'image.handle', false, shift, objectData);
                }
            }
            if(objectData.categoryId === '7') {
                const shift = recalculatePositions(parent, 'image.box', true);
                if(shift) {
                    recalculatePositions(parent, 'image.picture', false, shift, objectData);
                    recalculatePositions(parent, 'image.handle', false, shift, objectData);
                    recalculatePositions(parent, 'image.hingeTop', false, shift, objectData);
                    recalculatePositions(parent, 'image.hingeBottom', false, shift, objectData);
                }
            }
        }

        function recalculatePositions(parent, imageSelector, recalculate, shift, objectData) {
            const imageHeight = parent.select(imageSelector).attr('height');
            let imageWidth = parent.select(imageSelector).attr('width');
            const imageY = parent.select(imageSelector).attr('y');
            const imageX = parent.select(imageSelector).attr('x');
            const clipHeight = parent.select('clipPath rect').attr('height');
            const clipWidth = parent.select('clipPath rect').attr('width');
            const clipY = parent.select('clipPath rect').attr('y');
            const removeTextY = parent.select('text.removeText').attr('y');

            let yDiff = (d3.event.dy)*(-1);
            let xDiff = d3.event.dx;

            if(d3.event.dy < 0) {
                yDiff = Math.abs(d3.event.dy);
            }

            if(imageSelector === 'image.picture') {
                parent.select(imageSelector).attr('x', () => {
                    return shift.pxd;
                });

                parent.select(imageSelector).attr('width', () => {return shift.width;});

                parent.select(imageSelector).attr('y', () => {
                    return shift.pyd;
                });

                parent.select(imageSelector).attr('height', () => {return shift.height;});
            }

            if(imageSelector === 'image.handle') {
                parent.select(imageSelector).attr('x', () => {
                    return (objectData.categoryId === '7')? parseFloat(imageX) + shift.hgxd : parseFloat(imageX) + shift.hxd;
                });

                parent.select(imageSelector).attr('width', () => {return parseFloat(imageWidth) + shift.xd / 0.7;});

                parent.select(imageSelector).attr('y', () => {
                    return shift.hyd;
                });

                parent.select(imageSelector).attr('height', () => {return parseFloat(imageHeight) + shift.yd / 2;});
            }

            if(imageSelector === 'image.hingeTop' || imageSelector === 'image.hingeBottom') {
                parent.select(imageSelector).attr('x', () => {
                    return parseFloat(imageX) + shift.hingexd;
                });

                parent.select(imageSelector).attr('width', () => {return parseFloat(imageWidth) + shift.xd;});

                parent.select(imageSelector).attr('y', () => {
                    return (imageSelector === 'image.hingeBottom') ? shift.hingebottomyd : shift.hingeyd;
                });

                parent.select(imageSelector).attr('height', () => {return parseFloat(imageHeight) + shift.yd / 1.5;});
            }

            if(recalculate) {
                if(parseFloat(imageWidth) + xDiff  < 100) {
                 return false;
                 }

                 if(parseFloat(imageHeight) + yDiff < 220) {
                 return false;
                 }

                let imageXd = parent.select(imageSelector).data()[0].xd;
                let imageYd = parent.select(imageSelector).data()[0].yd;
                let imageYp = parent.select(imageSelector).data()[0].yp;

                let pictureXd = parent.select(imageSelector).data()[0].pictureXd;
                let handleXd = parent.select(imageSelector).data()[0].handleXd;
                let handleGXd = parent.select(imageSelector).data()[0].handleGXd;

                let pictureYd = parent.select(imageSelector).data()[0].pictureYd;
                let handleYd = parent.select(imageSelector).data()[0].handleYd;

                let hingeXd = parent.select(imageSelector).data()[0].hingeXd;
                let hingeYd = parent.select(imageSelector).data()[0].hingeYd;
                let hingeBottomYd = parent.select(imageSelector).data()[0].hingeBottomYd;

                const newImageXd = (imageXd * (parseFloat(imageWidth) + xDiff)) / parseFloat(imageWidth);
                const newImageYd = (imageYd * (parseFloat(imageHeight) + yDiff)) / parseFloat(imageHeight);
                const bottomPadding = (imageYp * (parseFloat(imageHeight) + yDiff)) / parseFloat(imageHeight);

                const newPictureXd = (pictureXd * (parseFloat(imageWidth) + xDiff)) / parseFloat(imageWidth);
                const newHandleXd = (handleXd * (parseFloat(imageWidth) + xDiff)) / parseFloat(imageWidth);
                const newHandleGXd = (handleGXd * (parseFloat(imageWidth) + xDiff)) / parseFloat(imageWidth);

                const newPictureYd = (pictureYd * (parseFloat(imageHeight) + yDiff)) / parseFloat(imageHeight);
                const newHandleYd = (handleYd * (parseFloat(imageHeight) + yDiff)) / parseFloat(imageHeight);

                const newHingeXd = (hingeXd * (parseFloat(imageWidth) + xDiff)) / parseFloat(imageWidth);
                const newHingeYd = (hingeYd * (parseFloat(imageHeight) + yDiff)) / parseFloat(imageHeight);
                const newHingeBottomYd = (hingeBottomYd * (parseFloat(imageHeight) + yDiff)) / parseFloat(imageHeight);

                parent.select(imageSelector).data()[0].xd = newImageXd;
                parent.select(imageSelector).data()[0].yd = newImageYd;
                parent.select(imageSelector).data()[0].yp = bottomPadding;

                parent.select(imageSelector).data()[0].pictureXd = newPictureXd;

                parent.select(imageSelector).data()[0].handleXd = newHandleXd;
                parent.select(imageSelector).data()[0].handleGXd = newHandleGXd;

                parent.select(imageSelector).data()[0].pictureYd = newPictureYd;
                parent.select(imageSelector).data()[0].handleYd = newHandleYd;

                parent.select(imageSelector).data()[0].hingeXd = newHingeXd;
                parent.select(imageSelector).data()[0].hingeYd = newHingeYd;
                parent.select(imageSelector).data()[0].hingeBottomYd = newHingeBottomYd;
                //debugger;
                //if(imageSelector !== 'image.picture') {

                parent.select(imageSelector).attr('x', () => {
                    return parseFloat(imageX) - ((newImageXd - imageXd)*1.5);
                });

                parent.select(imageSelector).attr('y', () => {
                    return parseFloat(imageY) - yDiff - (newImageYd - imageYd);
                });

                parent.select('clipPath rect').attr('height', () => {
                    return parseFloat(clipHeight) + yDiff - (newImageYd - imageYd) - (bottomPadding - imageYp);
                });
                parent.select('clipPath rect').attr('width', () => {
                    return parseFloat(clipWidth) + xDiff;
                    //ORIGINAL return parseFloat(clipWidth) + xDiff - (newImageXd - imageXd) * 2;
                });
                parent.select('clipPath rect').attr('y', () => {
                    return parseFloat(clipY) + (d3.event.dy);
                });

                parent.select('text.removeText').attr('y', () => {
                    return parseFloat(removeTextY) + (d3.event.dy)/* + 23*/;
                });

                let resizerX = parseFloat(parent.select('rect.resizer').attr('x'));
                let resizerY = parseFloat(parent.select('rect.resizer').attr('y'));
                parent.select('rect.resizer')
                    .attr('x', function () {
                        return resizerX + xDiff;
                    }).attr('y', function () {
                    return resizerY - yDiff;
                });

                parent.select(imageSelector).attr('height', () => {return parseFloat(imageHeight) + (yDiff);});
                parent.select(imageSelector).attr('width', () => {return (parseFloat(imageWidth)) + xDiff + (newImageXd - imageXd) * 3;});

                return {
                    'xd': newImageXd - imageXd,
                    'yd': newImageYd - imageYd,
                    'yp': bottomPadding - imageYp,
                    'pxd': parseFloat(imageX) - (newImageXd - imageXd) + newPictureXd,
                    'width': (parseFloat(imageWidth) + (xDiff)) - newPictureXd * 2,
                    'pyd': parseFloat(imageY) - yDiff - (newImageYd - imageYd) + newPictureYd,
                    'height': parseFloat(imageHeight) + (yDiff) - newPictureYd - bottomPadding,
                    'hxd': ((newImageXd - imageXd)) + (newHandleXd - handleXd)/9,
                    'hgxd': ((newImageXd - imageXd)) + (newHandleGXd - handleGXd)/9,

                    'hyd': parseFloat(imageY) - yDiff - (newImageYd - imageYd) + newHandleYd,

                    'hingexd': /*((newImageXd - imageXd)*3) + (newHingeXd - hingeXd)*/xDiff - (newImageXd - imageXd)*1.5,
                    'hingeyd': parseFloat(imageY) - yDiff - (newImageYd - imageYd) + newHingeYd,
                    'hingebottomyd': parseFloat(imageY) - yDiff - (newImageYd - imageYd) + newHingeBottomYd,
                };
            }
        }
    }
}

function base64ToArrayBuffer (base64) {
    'use strict';
    base64 = base64.replace(/^data\:([^\;]+)\;base64,/gmi, '');
    var binaryString = atob(base64);
    var len = binaryString.length;
    var bytes = new Uint8Array(len);
    for (var i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

export default DoorsController;