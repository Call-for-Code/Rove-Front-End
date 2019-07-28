import React, { useCallback, useMemo, useState } from 'react';

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
  position: [-95.51925, 29.57602, 80000]
});

const pointLight2 = new PointLight({
  color: [255, 255, 255],
  intensity: 0.8,
  position: [ -95.15665, 30.06671, 8000]
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

  const mappedData = useMemo(() => fulldata.map(record => [
    record.location_information.geometry.location.lng,
    record.location_information.geometry.location.lat
  ]), [fulldata]);

  const [scatterplotOn, setScatterplotOn] = useState(false);
  const [hexagonOn, setHexagonOn] = useState(true);
  const onScatterplotToggle = useCallback((e) => {
    setScatterplotOn(e.target.checked);
  }, []);
  const onHexagonToggle = useCallback((e) => {
    setHexagonOn(e.target.checked);
  }, []);

  const [hovered, setHovered] = useState(null);

  const _onHover = useCallback(({x, y, object}) => {
    setHovered({x, y, object});
  }, []);

  const _renderTooltip = () => {
    if(!hovered) {
      return null;
    }

    const {x, y, object} = hovered;

    if(!object) {
      return null;
    }

    if (object.position) {
      const lat = object.position[1];
      const lng = object.position[0];
      const count = object.points.length;

      return (
        <div className="tooltip" style={{left: x, top: y}}>
          <div>{`${count} reports`}</div>
          <div>{`latitude: ${Number.isFinite(lat) ? lat.toFixed(6) : ''}`}</div>
          <div>{`longitude: ${Number.isFinite(lng) ? lng.toFixed(6) : ''}`}</div>
        </div>
      );
    } else if (object.name) {
      const lat = object.location_information.geometry.location.lat;
      const lng = object.location_information.geometry.location.lng;
      const name = object.name;


      return (
        <div className="tooltip"  style={{left: x, top: y}}>
          <div>{`${name}`}</div>
          <div>{`latitude: ${Number.isFinite(lat) ? lat.toFixed(6) : ''}`}</div>
          <div>{`longitude: ${Number.isFinite(lng) ? lng.toFixed(6) : ''}`}</div>
          <div>Click for more info</div>
        </div>
      );
    }
  };

  return (
    <div className="map" style={{ position: 'relative' }}>
      <MapImpl
        hexagonOn={hexagonOn}
        mappedData={mappedData}
        fulldata={fulldata}
        scatterplotOn={scatterplotOn}
        handleSelectedPt={handleSelectedPt}
        handleHover={_onHover}
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

const MapImpl = React.memo(({hexagonOn, mappedData, fulldata, scatterplotOn, handleSelectedPt, handleHover, style}) => {
  const { radius = 200, upperPercentile = 100, lowerPercentile = 0, coverage = 0.5 } = {};

  const layers = useMemo(() => [
    hexagonOn ? new HexagonLayer({
      id: 'heatmap',
      colorRange,
      coverage,
      data: mappedData,
      elevationRange: [0, 500],
      elevationScale: 10,
      extruded: true,
      getPosition: d => d,
      opacity: 1,
      pickable: true,
      radius,
      upperPercentile,
      lowerPercentile,
      material,
      onClick: event => {
        console.log(event);
        return true;
      },
      onHover: handleHover
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
      getRadius: d => 10,
      getFillColor: d => scatterplotColorRange[Math.floor(d.overall.priority*6)],
      getLineColor: d => [0, 0, 0],
      onClick: (info, event) => {
        handleSelectedPt(info.object._id);
      },
      onHover: handleHover
    }) : null
  ], [hexagonOn, coverage, mappedData, radius, upperPercentile, lowerPercentile, scatterplotOn, fulldata, handleHover, handleSelectedPt]);

  return (
    <DeckGL
      layers={layers}
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
});

MapImpl.whyDidYouRender = {
  logOnDifferentValues: true
};

export default Map;
