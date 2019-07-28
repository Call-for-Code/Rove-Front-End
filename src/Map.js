import React, { useState } from 'react';

import 'mapbox-gl/dist/mapbox-gl.css';

import { Checkbox, Radio, Card } from 'antd';

import { AmbientLight, PointLight, LightingEffect } from '@deck.gl/core';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import DeckGL from '@deck.gl/react';
import { StaticMap } from 'react-map-gl';
import { PhongMaterial } from '@luma.gl/core';

import './Map.css';

const MAPBOX_TOKEN =
  'pk.eyJ1IjoicGx1c2N1YmVkIiwiYSI6ImNqeHZmam5zZzA0Z2MzaG5ybGtoZGd6dnAifQ.gUSmW8JdYliAmo2JbvzxGA';
const MAPBOX_STYLE =
  'mapbox://styles/pluscubed/cjyi8b2lh06p81cmd0awqozo0';

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 1.0
});

const pointLight1 = new PointLight({
  color: [255, 255, 255],
  intensity: 0.8,
  position: [-0.144528, 49.739968, 80000]
});

const pointLight2 = new PointLight({
  color: [255, 255, 255],
  intensity: 0.8,
  position: [-3.807751, 54.104682, 8000]
});

const lightingEffect = new LightingEffect({
  ambientLight,
  pointLight1,
  pointLight2
});

const material = new PhongMaterial({
  ambient: 0.64,
  diffuse: 0.6,
  shininess: 32,
  specularColor: [51, 51, 51]
});

const INITIAL_VIEW_STATE = {
  longitude: -95.12168035,
  latitude: 29.55954121,
  zoom: 8,
  minZoom: 5,
  maxZoom: 15,
  pitch: 40.5,
  bearing: -27.396674584323023
};

const colorRange = [
  [1, 152, 189],
  [73, 227, 206],
  [216, 254, 181],
  [254, 237, 177],
  [254, 173, 84],
  [209, 55, 78]
];

const scatterplotColorRange = [
  [255, 255, 178, 25],
  [254, 217, 118, 85],
  [254, 178, 76, 127],
  [253, 141, 60, 170],
  [240, 59, 32, 212],
  [189, 0, 38, 255]
];

function Map({ fulldata, handleSelectedPt}) {
  const [style, setStyle] = useState(MAPBOX_STYLE);
  const onRadioChange = e => {
    setStyle(e.target.value);
  };

  const mappedData = fulldata.map(record => [
    record.location_information.geometry.location.lng,
    record.location_information.geometry.location.lat
  ]);

  const [scatterplotOn, setScatterplotOn] = useState(false);
  const [hexagonOn, setHexagonOn] = useState(true);
  const onScatterplotToggle = (e) => {
    setScatterplotOn(e.target.checked);
  };
  const onHexagonToggle = (e) => {
    setHexagonOn(e.target.checked);
  };

  const [hovered, setHovered] = useState(null);

  function _onHover ({x, y, object}) {
    setHovered({x, y, hoveredObject: object});
  }

  const _renderTooltip = () => {
    if(!hovered) {
      return null;
    }

    const {x, y, hoveredObject} = hovered;

    if (!hoveredObject) {
      return null;
    }

    const lat = hoveredObject.location_information.geometry.location.lat;
    const lng = hoveredObject.location_information.geometry.location.lng;
    const name = hoveredObject.name;

    return (
      <div className="tooltip" style={{color: 'white', left: x, top: y, position: 'absolute', backgroundColor: 'black'}}>
        <div>{`${name}`}</div>
        <div>{`latitude: ${Number.isFinite(lat) ? lat.toFixed(6) : ''}`}</div>
        <div>{`longitude: ${Number.isFinite(lng) ? lng.toFixed(6) : ''}`}</div>
      </div>
    );
  };

  return (
    <div className="map" style={{ position: 'relative' }}>
      <MapImpl
        hexagonOn={hexagonOn}
        mappedData={mappedData}
        fulldata={fulldata}
        scatterplotOn={scatterplotOn}
        handleSelectedPt={handleSelectedPt}
        onHover={_onHover}
        style={style}
      />
      <div className="style">
        <Radio.Group onChange={onRadioChange} value={style}>
          <Radio.Button value={MAPBOX_STYLE}>Normal</Radio.Button>
          <Radio.Button value="mapbox://styles/mapbox/satellite-v9">Satellite</Radio.Button>
        </Radio.Group><br/>
      </div>
      <Card className="layers">
        <Checkbox onChange={onHexagonToggle} checked={hexagonOn}>Report Heatmap</Checkbox><br/>
        <Checkbox onChange={onScatterplotToggle} checked={scatterplotOn}>Priority Scatterplot</Checkbox>
      </Card>

      {_renderTooltip()}
    </div>
  );
}

function MapImpl({hexagonOn, mappedData, fulldata, scatterplotOn, handleSelectedPt, onHover, style}) {
  const _renderLayers = () => {
    const { radius = 200, upperPercentile = 100, lowerPercentile = 0, coverage = 0.5 } = {};

    return [
      hexagonOn ? new HexagonLayer({
        id: 'heatmap',
        colorRange,
        coverage,
        data: mappedData,
        elevationRange: [0, 500],
        elevationScale: 10,
        extruded: true,
        getPosition: d => d,
        onHover: () => {},
        opacity: 1,
        pickable: true,
        radius,
        upperPercentile,
        lowerPercentile,
        material,
        onClick: event => {
          console.log(event);
          return true;
        }
      }) : null,
      scatterplotOn ? new ScatterplotLayer({
        id: 'scatterplot',
        data: fulldata,
        pickable: true,
        opacity: 0.8,
        stroked: false,
        filled: true,
        radiusScale: 6,
        radiusMinPixels: 1,
        radiusMaxPixels: 100,
        lineWidthMinPixels: 1,
        getPosition: d => [
          d.location_information.geometry.location.lng,
          d.location_information.geometry.location.lat
        ],
        getRadius: d => 5,
        getFillColor: d => scatterplotColorRange[Math.floor(d.overall.priority*6)],
        getLineColor: d => [0, 0, 0],
        onClick: (info, event) => {
          handleSelectedPt(info.object._id);
        },
        onHover: (info, event) => {
          onHover({
            x: info.x,
            y: info.y,
            object: info.object
          })
        }
      }) : null
    ];
  };

  return (
    <DeckGL
      layers={_renderLayers()}
      effects={[lightingEffect]}
      initialViewState={INITIAL_VIEW_STATE}
      controller={true}
    >
      <StaticMap
        reuseMaps
        mapStyle={style}
        preventStyleDiffing={true}
        mapboxApiAccessToken={MAPBOX_TOKEN}
      />
    </DeckGL>
  );
}

export default Map;
