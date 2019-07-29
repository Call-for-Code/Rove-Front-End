import React, { useCallback, useEffect, useMemo, useState } from 'react';

import 'mapbox-gl/dist/mapbox-gl.css';

import { Checkbox, Radio, Card } from 'antd';

import { AmbientLight, PointLight, LightingEffect } from '@deck.gl/core';
import { HexagonLayer } from '@deck.gl/aggregation-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import DeckGL from '@deck.gl/react';
import { FlyToInterpolator, StaticMap } from 'react-map-gl';
import { PhongMaterial } from '@luma.gl/core';

import './Map.css';

const MAPBOX_TOKEN =
  'pk.eyJ1IjoicGx1c2N1YmVkIiwiYSI6ImNqeHZmam5zZzA0Z2MzaG5ybGtoZGd6dnAifQ.gUSmW8JdYliAmo2JbvzxGA';
const MAPBOX_STYLE = 'mapbox://styles/pluscubed/cjyi8b2lh06p81cmd0awqozo0';

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
  position: [-95.15665, 30.06671, 8000]
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
  longitude: -95.3428485221802,
  latitude: 29.7298513221863,
  zoom: 9.27,
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

const randomColors = [
  [230, 25, 75], [60, 180, 75], [255, 225, 25], [0, 130, 200], [245, 130, 48], [145, 30, 180], [70, 240, 240], [240, 50, 230], [210, 245, 60], [250, 190, 190], [0, 128, 128], [230, 190, 255], [170, 110, 40], [255, 250, 200], [128, 0, 0], [170, 255, 195], [128, 128, 0], [255, 215, 180], [0, 0, 128], [128, 128, 128], [255, 255, 255], [0, 0, 0]
];

function Map({
  tab,
  ...rest
}) {
  const [style, setStyle] = useState(MAPBOX_STYLE);
  const onRadioChange = e => {
    setStyle(e.target.value);
  };

  const [scatterplotOn, setScatterplotOn] = useState(false);
  const [hexagonOn, setHexagonOn] = useState(true);
  const onScatterplotToggle = useCallback(e => {
    setScatterplotOn(e.target.checked);
  }, []);
  const onHexagonToggle = useCallback(e => {
    setHexagonOn(e.target.checked);
  }, []);

  const [hovered, setHovered] = useState(null);

  const onHover = useCallback(({ x, y, object }) => {
    setHovered({ x, y, object });
  }, []);

  const renderTooltip = () => {
    if (!hovered) {
      return null;
    }
    const { x, y, object } = hovered;
    if (!object) {
      return null;
    }

    if (object.position) {
      const lat = object.position[1];
      const lng = object.position[0];
      const count = object.points.length;

      return (
        <div className="tooltip" style={{ left: x, top: y }}>
          <div>{`${count} reports`}</div>
          <div>{`latitude: ${Number.isFinite(lat) ? lat.toFixed(6) : ''}`}</div>
          <div>{`longitude: ${
            Number.isFinite(lng) ? lng.toFixed(6) : ''
          }`}</div>
        </div>
      );
    } else if (object.name) {
      const lat = object.location_information.geometry.location.lat;
      const lng = object.location_information.geometry.location.lng;
      const name = object.name;

      return (
        <div className="tooltip" style={{ left: x, top: y }}>
          <div>{`${name}`}</div>
          <div>{`latitude: ${Number.isFinite(lat) ? lat.toFixed(6) : ''}`}</div>
          <div>{`longitude: ${
            Number.isFinite(lng) ? lng.toFixed(6) : ''
          }`}</div>
          <div>Click for more info</div>
        </div>
      );
    }
  };

  return (
    <div className="map" style={{ position: 'relative' }}>
      <MapImpl
        hexagonOn={hexagonOn}
        scatterplotOn={scatterplotOn}
        handleHover={onHover}
        style={style}
        tab={tab}
        {...rest}
      />
      <div className="style">
        <Radio.Group onChange={onRadioChange} value={style}>
          <Radio.Button value={MAPBOX_STYLE}>Normal</Radio.Button>
          <Radio.Button value="mapbox://styles/mapbox/satellite-v9">
            Satellite
          </Radio.Button>
        </Radio.Group>
        <br />
      </div>
      { tab==='1' ?
        <Card className="layers">
          <div className="layers-label">Layers</div>
          <Checkbox onChange={onHexagonToggle} checked={hexagonOn}>
            Count Heatmap
          </Checkbox>
          <br/>
          <Checkbox onChange={onScatterplotToggle} checked={scatterplotOn}>
            Priority Scatterplot
          </Checkbox>
        </Card> : null
      }

      {renderTooltip()}
    </div>
  );
}

const MapImpl = React.memo(
  ({
    hexagonOn,
    fulldataLngLats,
    fulldata,
    scatterplotOn,
    handleSelectedPt,
    handleHover,
    style,
    tab,
    kmeansResult,
    selectedPt,
    fullclusters
  }) => {
    const {
      radius = 200,
      upperPercentile = 100,
      lowerPercentile = 0,
      coverage = 0.7
    } = {};

    let layers = [];
    if(tab==='1'){
      layers.push(hexagonOn
        ? new HexagonLayer({
          id: 'heatmap',
          colorRange,
          coverage,
          data: fulldataLngLats,
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
        })
        : null,
        scatterplotOn
          ? new ScatterplotLayer({
            id: 'scatterplot-pts',
            data: fulldata,
            pickable: true,
            opacity: 0.8,
            stroked: false,
            filled: true,
            radiusScale: 6,
            radiusMinPixels: 1,
            radiusMaxPixels: 100,
            lineWidthMinPixels: 1,
            getPosition: (d) => {
              return [
                d.location_information.geometry.location.lng,
                d.location_information.geometry.location.lat
              ];
            },
            getRadius: d => 10,
            getFillColor: d => scatterplotColorRange[Math.max(0, Math.min(5, Math.floor(d.overall.priority * 6)))],
            getLineColor: d => [0, 0, 0],
            onClick: (info, event) => {
              handleSelectedPt(info.object._id);
            },
            onHover: handleHover
          })
          : null)
    } else if (tab==='2') {
      console.log(fullclusters);
      layers.push(
        new ScatterplotLayer({
          id: 'scatterplot',
          data: fullclusters,
          pickable: true,
          opacity: 0.8,
          stroked: false,
          filled: true,
          radiusScale: 100,
          radiusMinPixels: 1,
          radiusMaxPixels: 100,
          lineWidthMinPixels: 1,
          getPosition: (d) => {
            return d.centroid;
          },
          getRadius: d => {
            return Math.sqrt(d.reports.length)
          },
          getFillColor: d => scatterplotColorRange[Math.max(0, Math.min(5, Math.floor((d.overallPriority-0.5) * 15 + 5)))],
          getLineColor: d => [0, 0, 0],
          onClick: (info, event) => {

          },
          onHover: (info, event) => {

          }
        }));
      if(kmeansResult){
        kmeansResult.forEach((cluster, i) => {
          layers.push(new ScatterplotLayer({
            id: 'scatterplot-cluster' + i,
            data: cluster.cluster,
            pickable: true,
            opacity: 0.8,
            stroked: false,
            filled: true,
            radiusScale: 6,
            radiusMinPixels: 1,
            radiusMaxPixels: 100,
            lineWidthMinPixels: 1,
            getPosition: (d) => d,
            getRadius: d => 10,
            getFillColor: d => randomColors[i],
            getLineColor: d => [0, 0, 0],
            onClick: (info, event) => {
              handleSelectedPt(info.object._id);
            },
            onHover: handleHover
          }))
        });
      }
    }

    const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
    useEffect(() => {
      if(!selectedPt) {
        return;
      }
      const selectedPtData = fulldata.filter(record => record._id === selectedPt)[0];
      setViewState({
        ...viewState,
        longitude: selectedPtData.location_information.geometry.location.lng,
        latitude: selectedPtData.location_information.geometry.location.lat,
        zoom: 14,
        pitch: 40.5,
        bearing: -27.396674584323023,
        transitionDuration: 500,
        transitionInterpolator: new FlyToInterpolator(),
        transitionEasing: t => {return t<.5 ? 2*t*t : -1+(4-2*t)*t}
      })
    }, [selectedPt]);

    return (
      <DeckGL
        viewState={viewState}
        onViewStateChange={({viewState}) => setViewState(viewState)}
        layers={layers}
        effects={[lightingEffect]}
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
);

MapImpl.whyDidYouRender = true;

export default Map;
