import React, { useState } from 'react';
import { Icon, List, Select } from 'antd';
import * as Icons from './icons';
import VList from 'react-virtualized/dist/commonjs/List';
import AutoSizer from 'react-virtualized/dist/commonjs/AutoSizer';
const { Option } = Select;

export function GatherPane({ fulldata }) {
  const [selected, setSelected] = useState('overall');

  const fulldataSorted = fulldata.sort((left, right) => {
    if (selected === 'overall') {
      return right.overall.priority - left.overall.priority;
    } else if (selected === 'health') {
      return right.health.priority - left.health.priority;
    } else if (selected === 'food') {
      return right.food.priority - left.food.priority;
    } else if (selected === 'hygiene') {
      return right.hygiene.priority - left.hygiene.priority;
    }
    return 0;
  });

  const renderItem = ({ index, key, style }) => {
    const item = fulldataSorted[index];
    return (
      <List.Item key={key} style={style} className="row">
        <List.Item.Meta
          title={<div>{item.name}</div>}
          description={
            <div>
              Overall: {(item.overall.priority * 10).toFixed(1)}
              <Icon className="rowIcon" component={Icons.Bandage}/>{' '}
              {(item.health.priority * 10).toFixed(1)}
              <Icon className="rowIcon" component={Icons.Food}/>{' '}
              {(item.food.priority * 10).toFixed(1)}
              <Icon className="rowIcon" component={Icons.Toilet}/>{' '}
              {(item.hygiene.priority * 10).toFixed(1)}
            </div>
          }
        />
      </List.Item>
    );
  };

  const Vlist = ({ height, width }) => (
    <VList
      height={height}
      overscanRowCount={2}
      rowCount={fulldataSorted.length}
      rowHeight={73}
      rowRenderer={renderItem}
      width={width}
    />
  );
  const AutoSize = () => (
    <AutoSizer>
      {({ width, height }) =>
        Vlist({
          height,
          width
        })
      }
    </AutoSizer>
  );

  return (
    <div className="gather">
      <div className="select">
        <span className="sort">Sort by Priority:</span>
        <Select value={selected} onChange={v => setSelected(v)}>
          <Option value="overall">
            <div className="option">Overall</div>
          </Option>
          <Option value="health">
            <div className="option">
              <Icon className="icon" component={Icons.Bandage}/>
              Health
            </div>
          </Option>
          <Option value="food">
            <div className="option">
              <Icon className="icon" component={Icons.Food}/>
              Food
            </div>
          </Option>
          <Option value="hygiene">
            <div className="option">
              <Icon className="icon" component={Icons.Toilet}/>
              Hygiene
            </div>
          </Option>
        </Select>
      </div>

      <div className="divider" style={{ gridArea: 'dividerTop' }}/>

      <div className="rawlist">
        <AutoSize/>
      </div>

      <div className="divider" style={{ gridArea: 'dividerBottom' }}/>

      <div className="info">HERE'S SOME INFO</div>
    </div>
  );
}