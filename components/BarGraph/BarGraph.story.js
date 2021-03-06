import React, { Component } from 'react';
import { storiesOf, action } from '@storybook/react';
import BarGraph from './BarGraph';

class UpdatingBarGraphContainer extends Component {
  state = {
    data: createGroupedData(6).sort(function(a, b) {
      return a[a.length - 1] - b[b.length - 1];
    }),
  };

  componentDidMount() {
    let i = 0;
    setInterval(() => {
      this.updateData(i);
      i++;
    }, 5000);
  }

  updateData(i) {
    let data = createGroupedData(6).sort(function(a, b) {
      return a[a.length - 1] - b[b.length - 1];
    });

    this.setState({
      data,
      xAxisLabel: `${i}`,
      yAxisLabel: `${i}`,
    });
  }

  render() {
    const { data } = this.state;
    const props = {
      margin: {
        top: 30,
        right: 20,
        bottom: 75,
        left: 65,
      },
      height: 300,
      width: 800,
      labelOffsetY: 55,
      labelOffsetX: 65,
      axisOffset: 16,
      yAxisLabel: this.state.yAxisLabel,
      xAxisLabel: this.state.xAxisLabel,
      onHover: action('Hover'),
      timeFormat: '%b',
      id: this.props.id,
      containerId: this.props.containerId,
      drawLine: this.props.drawLine,
    };

    return <BarGraph data={data} {...props} />;
  }
}

function createData(num) {
  let data = [];
  for (let i = 0; i < num; i++) {
    let tempArr = [];
    let randomNum = Math.floor(Math.random() * 1000 + 1);
    let d = new Date();
    d = d.setDate(d.getDate() + i * 30);
    tempArr.push([randomNum], d);
    data.push(tempArr);
  }
  return data;
}

function createGroupedData(num) {
  let data = [];
  for (let i = 0; i < num; i++) {
    let numArr = [];
    const one = Math.floor(Math.random() * 1000 + 10);
    const two = Math.floor(Math.random() * 1000 + 10);
    const three = Math.floor(Math.random() * 1000 + 10);
    const four = Math.floor(Math.random() * 1000 + 10);
    const five = Math.floor(Math.random() * 1000 + 10);
    numArr.push(one, two, three, four, five);
    let d = new Date();
    d = d.setDate(d.getDate() - i * 30);
    const entry = [numArr, d];
    data.push(entry);
  }
  return data;
}

let data = createData(12).sort(function(a, b) {
  return a[1] - b[1];
});

let groupedData = createGroupedData(3).sort(function(a, b) {
  return a[1] - b[1];
});

let singleData = createData(1).sort(function(a, b) {
  return a[1] - b[1];
});

const props = {
  margin: {
    top: 30,
    right: 20,
    bottom: 75,
    left: 65,
  },
  height: 300,
  enableLabelWrapping: true,
  width: 800,
  labelOffsetY: 55,
  labelOffsetX: 65,
  axisOffset: 16,
  yAxisLabel: 'Amount ($)',
  xAxisLabel: 'Date',
  onHover: action('Hover'),
  id: 'bar-graph-1',
  containerId: 'bar-graph-container',
};

storiesOf('BarGraph', module)
  .addWithInfo(
    'Default',
    `
      Bar Graph.
    `,
    () => (
      <BarGraph
        timeFormat="%b"
        formatValue={value => `$${value / 1000}`}
        onHover={action('Hover')}
        data={data}
        {...props}
      />
    )
  )
  .addWithInfo(
    'Grouped',
    `
     Grouped Bar Graph.
    `,
    () => (
      <BarGraph
        timeFormat="%b"
        onHover={action('Hover')}
        data={groupedData}
        {...props}
        seriesLabels={[
          'Series 1',
          'Series 2',
          'Series 3',
          'Series 4',
          'Series 5',
        ]}
      />
    )
  )
  .addWithInfo(
    'Grouped with Custom Labels',
    `
     Grouped Bar Graph with custom labels.
    `,
    () => (
      <BarGraph
        onHover={action('Hover')}
        data={[
          [[6810753.913996485, 322316.83828169684], 'NEW YORK CITY, NEW YORK, UNITED STATES'],
          [[2029509.2509859744, 319256.4128819143], 'LONDON, GREAT BRITAIN'],
          [[1180299.5624584288, 98796.86410370439], 'AUSTIN, TX, US'],
          [[997409.8602056602, 301419.9550709436], 'DALLAS, TX, US'],
          [[1306600.6748098487, 82748.73011782495], 'DURHAM, NC, US'],
        ]}
        width={750}
        yAxisLabel="Amount ($)"
        xAxisLabel=""
        enableLabelWrapping
        seriesLabels={['Fixed Rate', 'Dynamic Rate']}
      />
    )
  )
  .addWithInfo(
    'Resizing',
    `
      Auto resizing Horizontal Bar Graph.
    `,
    () => {
      class ResizingGraph extends React.PureComponent {
        state = {
          height: Math.max(300, Math.min(Math.random() * 1000, 300)),
          width: Math.max(650, Math.min(Math.random() * 1000, 800)),
        };

        resizeInterval = null;

        componentDidMount() {
          this.resizeInterval = setInterval(() => {
            this.setState({
              height: Math.max(200, Math.min(Math.random() * 1000, 300)),
              width: Math.max(600, Math.min(Math.random() * 1000, 800)),
            });
          }, 2500);
        }

        componentWillUnmount() {
          clearInterval(this.resizeInterval);
          this.resizeInterval = null;
        }

        render() {
          const { width, height } = this.state;
          return (
            <BarGraph
              timeFormat="%b"
              data={data}
              // xDomain={ _.max(groupedData.flatMap(d => d[0])) * 1.1 }
              {...props}
              width={width}
              height={height}
            />
          );
        }
      }

      return <ResizingGraph />;
    }
  )
  .addWithInfo(
    'Updating',
    `
     Updating Grouped Bar Graph.
    `,
    () => <UpdatingBarGraphContainer />
  )
  .addWithInfo(
    'Empty',
    `
     Empty Bar Graph.
    `,
    () => <BarGraph onHover={action('Hover')} data={singleData} {...props} />
  );
