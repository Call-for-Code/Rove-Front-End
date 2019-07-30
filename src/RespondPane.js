import React, { useCallback, useMemo, useState } from 'react';
import { Icon, List, Select } from 'antd';
import * as Icons from './icons';
import VList from 'react-virtualized/dist/commonjs/List';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';

import './RespondPane.css';

const { Option } = Select;

const getPriorityUiString = priority => {
  let style;
  if (priority < 0.3) {
    style = 'status-low';
  } else if (priority < 0.6) {
    style = 'status-medium';
  } else {
    style = 'status-high';
  }
  return (
    <span className={style}>{Math.max(0, 10 - priority * 10).toFixed(1)}</span>
  );
};

function RespondPane({
  firestations,
  fulldata,
  selectedCluster,
  handleSelectedCluster,
  fulldataLngLats,
  fullclusters,
  selectedFirestation,
  handleSelectedFirestation
}) {
  const renderItem = ({ index, key }) => {
    const firestation = firestations.features[index];

    const handleItemClick = item => {
      handleSelectedFirestation(item);
    };
    console.log(firestation);
    return (
      <List.Item
        key={key}
        className="row"
        onClick={() => handleItemClick(firestation)}
      >
        <List.Item.Meta
          title={<div>{firestation.properties.name}</div>}
          description={
            <div
              dangerouslySetInnerHTML={{
                __html: firestation.properties.description
              }}
            />
          }
        />
      </List.Item>
    );
  };

  const renderClusterItem = ({ index, key, style }) => {
    const cluster = fullclusters[index];

    const handleItemClick = item => {
      handleSelectedCluster(item);
    };

    return (
      <List.Item
        key={key}
        style={style}
        className="row"
        onClick={() => handleItemClick(cluster)}
      >
        <List.Item.Meta
          title={<div>Cluster - {cluster.reports.length} reports</div>}
          description={
            <div>
              Overall: {getPriorityUiString(cluster.overallPriority)}
              <Icon className="rowIcon" component={Icons.Bandage} />{' '}
              {getPriorityUiString(cluster.healthPriority)}
              <Icon className="rowIcon" component={Icons.Food} />{' '}
              {getPriorityUiString(cluster.foodPriority)}
              <Icon className="rowIcon" component={Icons.Toilet} />{' '}
              {getPriorityUiString(cluster.hygienePriority)}
            </div>
          }
        />
      </List.Item>
    );
  };

  /*
    const selectedPtData = fulldata.filter(record => record._id === selectedPt);
    let info;
    if(selectedPtData[0]) {
      const report = selectedPtData[0];
      info =
        <div>
          <div className="row-label">Name:  </div> {report.name} <br/>
          <div className="row-label">Phone:  </div> {report.phone_number} <br/>
          <div className="row-label">Location:  </div> {report.location_information.geometry.location.lat.toFixed(5)}, {report.location_information.geometry.location.lng.toFixed(5)} <br/>
          <div className="row-label">Keywords:  </div> {report.health.key_words.join(', ')} <br/>
          <div className="row-label">Health:  </div> {getPriorityUiString(report.health.priority)} <br/>
          <div className="row-label">Food:  </div> {getPriorityUiString(report.food.priority)} <br/>
          <div className="row-label">Hygiene:  </div> {getPriorityUiString(report.hygiene.priority)} <br/>
        </div>
    } else {
      info = "Select a report in the above list or Priority Scatterplot"
    }*/

  return (
    <div className="respond">
      <div className="fyi">Navigate around flooded areas</div>

      <div className="from">
        <span className="from-label">From:</span>
        <span>
          {selectedFirestation && selectedFirestation.properties ? (
            selectedFirestation.properties.name
          ) : (
            <span style={{ fontStyle: 'italic' }}>Select a fire station (blue dot)</span>
          )}
        </span>
      </div>

      <div className="divider" style={{ gridArea: 'dividerTop' }} />

      <div className="respond-rawlist">
        {firestations
          ? firestations.features.map((firestation, index) => {
              return renderItem({
                index: index,
                key: firestation.geometry.coordinates.join(',')
              });
            })
          : null}
      </div>

      <div className="divider-mid" style={{ gridArea: 'dividerMid' }} />

      <div className="to">
        <span className="to-label">To:</span>
        <span>
          {selectedCluster ? (
            <span>Cluster - {selectedCluster.reports.length} reports</span>
          ) : (
            <span style={{ fontStyle: 'italic' }}>Select a cluster</span>
          )}
        </span>
      </div>

      <div className="divider" style={{ gridArea: 'dividerMidBottom' }} />

      <div className="respond-rawlist-cluster">
        <AutoSizer>
          {({ width, height }) => (
            <VList
              height={height}
              overscanRowCount={2}
              rowCount={fullclusters.length}
              rowHeight={73}
              rowRenderer={renderClusterItem}
              width={width}
            />
          )}
        </AutoSizer>
      </div>

      <div className="divider" style={{ gridArea: 'dividerBottom' }} />

      <div className="organize-info">{/* {info}*/}</div>
    </div>
  );
}

RespondPane.whyDidYouRender = true;

export { RespondPane };