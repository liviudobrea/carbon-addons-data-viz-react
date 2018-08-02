import React, { Component } from 'react';
import { extent } from 'd3';
import { storiesOf, action } from '@storybook/react';
import LineGraph from './LineGraph';
import flatMap from 'lodash/flatMap';

class LineGraphContainer extends Component {
  state = {
    data: createData(12).sort(function(a, b) {
      return a[a.length - 1] - b[b.length - 1];
    }),
    datasets: [],
  };

  static defaultProps = {
    datasets: [],
  };

  static getDerivedStateFromProps(props, state) {
    if (!state.datasets.length && props.datasets.length) {
      return { datasets: [].concat(props.datasets, state.datasets) };
    }
    return state;
  }

  componentDidMount() {
    let i = 0;
    this.interval = setInterval(() => {
      this.updateData(i);
      i++;
    }, 5000);
  }

  componentWillUnmount() {
    window.clearInterval(this.interval);
  }

  updateData(i) {
    let data = [];
    let datasets = [];
    if (this.props.datasets.length) {
      datasets = createDataSets(this.props.datasets.length);
    } else {
      data = createData(12).sort(function(a, b) {
        return a[a.length - 1] - b[b.length - 1];
      });
    }

    this.setState({
      data: data,
      datasets: datasets,
      xAxisLabel: `${i}`,
      yAxisLabel: `${i}`,
    });
  }

  render() {
    const props = Object.assign({}, this.props, {
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
      timeFormat: '%I:%M:%S',
      yAxisLabel: this.state.yAxisLabel,
      xAxisLabel: this.state.xAxisLabel,
      data: !this.props.datasets.length ? this.state.data : [],
      datasets: this.state.datasets,
      onHover: action('Hover'),
      id: this.props.id,
      containerId: this.props.containerId,
      drawLine: this.props.drawLine,
      animateAxes: this.props.animateAxes,
    });

    return <LineGraph {...props} />;
  }
}

const createData = num => {
  let data = [];
  for (let i = 0; i < num; i++) {
    let tempArr = [];
    let d = new Date();
    let randomNum = Math.floor(Math.random() * 1000 + 1);
    d.setFullYear(d.getFullYear() + i);
    tempArr.push(randomNum, d.getTime());
    data.push(tempArr);
  }

  return data;
};

const createDataSets = (lines, sets) => {
  return Array.from({ length: lines }, () =>
    Array.from({ length: sets }, (v, idx) => {
      const date = new Date();
      date.setMonth(date.getMonth() + idx);
      if (idx % 2 === 0) {
        return [
          idx + Math.floor(Math.random() * 1000 * 1000 * 1000),
          date.getTime(),
        ];
      }
      return [
        Math.abs(idx - Math.floor(Math.random() * 1000 * 1000 * 1000)),
        date.getTime(),
      ];
    })
  );
};

storiesOf('LineGraph', module)
  .addWithInfo(
    'Updating',
    `
      Line Graph.
    `,
    () => (
      <div>
        <LineGraphContainer
          onHover={action('Hover')}
          onMouseOut={action('Mouseout')}
          onBlur={action('Blur')}
        />
        <LineGraphContainer
          id="two"
          containerId="test-two"
          onHover={action('Hover')}
          onMouseOut={action('Mouseout')}
          onBlur={action('Blur')}
        />
      </div>
    )
  )
  .addWithInfo(
    'Updating without drawing line',
    `
      Line Graph without draw line animation.
    `,
    () => (
      <div>
        <LineGraphContainer
          onHover={action('Hover')}
          onMouseOut={action('Mouseout')}
          onBlur={action('Blur')}
          drawLine={false}
        />
        <LineGraphContainer
          id="two"
          containerId="test-two"
          onHover={action('Hover')}
          onMouseOut={action('Mouseout')}
          onBlur={action('Blur')}
          drawLine={false}
        />
      </div>
    )
  )
  .addWithInfo(
    'Updating without animating axes',
    `
      Line Graph without axes animation.
    `,
    () => (
      <div>
        <LineGraphContainer
          onHover={action('Hover')}
          onMouseOut={action('Mouseout')}
          onBlur={action('Blur')}
          animateAxes={false}
        />
        <LineGraphContainer
          id="two"
          containerId="test-two"
          onHover={action('Hover')}
          onMouseOut={action('Mouseout')}
          onBlur={action('Blur')}
          animateAxes={false}
        />
      </div>
    )
  )
  .addWithInfo('Static', ` Static Example. `, () => (
    <LineGraph
      timeFormat="%m-%Y"
      data={createData(4)}
      showLegend
      hoverOverlay
      multiValueTooltip
      formatValue={v => `${v / 1000}k`}
      onHover={action('Hover')}
      onMouseOut={action('Mouseout')}
      onBlur={action('Blur')}
    />
  ))
  .addWithInfo('Custom xDomain', ` Static Example. `, () => {
    const datasets = createDataSets(4, 5);
    const [min, max] = extent(flatMap(datasets).map(d => d[1]));
    const minDate = new Date(min);
    minDate.setDate(minDate.getDate() - 5);
    const maxDate = new Date(max);
    maxDate.setDate(maxDate.getDate() + 5);
    return (
      <LineGraph
        timeFormat="%m-%Y"
        datasets={datasets}
        seriesLabels={Array.from({ length: datasets }, (v, k) => `Series ${k}`)}
        xDomain={[minDate.getTime(), maxDate.getTime()]}
        showLegend
        hoverOverlay
        multiValueTooltip
        onHover={action('Hover')}
        onMouseOut={action('Mouseout')}
        onBlur={action('Blur')}
      />
    );
  })
  .addWithInfo('Number values for X', ` Static Example. `, () => (
    <LineGraph
      datasets={createDataSets(4, 5).map(set => set.map((v, i) => [v[0], i]))}
      onHover={action('Hover')}
      onMouseOut={action('Mouseout')}
      onBlur={action('Blur')}
      hoverOverlay
      seriesLabels={Array.from({ length: 4 }, (v, k) => `Series ${k}`)}
      showLegend
      isXTime={false}
    />
  ))
  .addWithInfo('Logarithmic', ` Static Example. `, () => (
    <LineGraph
      datasets={createDataSets(4, 5)}
      scaleType="log"
      // onHover={action('Hover')}
      // onMouseOut={action('Mouseout')}
      // onBlur={action('Blur')}
      seriesLabels={Array.from({ length: 4 }, (v, k) => `Series ${k}`)}
      showLegend
      hoverOverlay
      multiValueTooltip
      timeFormat="%m-%Y"
      formatTooltipData={({ datasets, data, seriesLabels, label, color }) => {
        const dataSets = flatMap(datasets, v =>
          v.filter(d => d.includes(data[data.length - 1]))
        );
        return dataSets.map((dataSet, idx) => ({
          data: dataSet[0],
          label:
            seriesLabels && seriesLabels.length ? seriesLabels[idx] : label,
          color: color[idx],
        }));
      }}
    />
  ))
  .addWithInfo('Logarithmic - Custom Y Domain', ` Static Example. `, () => {
    const datasets = createDataSets(4, 5);
    const flattened = flatMap(datasets).map(d => d[0]);
    const { 0: min, [flattened.length - 1]: max } = flattened.sort(
      (a, b) => a - b
    );
    return (
      <LineGraph
        datasets={datasets}
        scaleType="log"
        yDomain={[min / 1.005, max * 1.005]}
        yAxisTicks={3}
        seriesLabels={Array.from({ length: datasets }, (v, k) => `Series ${k}`)}
        showLegend
        hoverOverlay
        multiValueTooltip
        timeFormat="%m-%Y"
        formatTooltipData={({ datasets, data, seriesLabels, label, color }) => {
          const dataSets = flatMap(datasets, v =>
            v.filter(d => d.includes(data[data.length - 1]))
          );
          return dataSets.map((dataSet, idx) => ({
            data: dataSet[0],
            label:
              seriesLabels && seriesLabels.length ? seriesLabels[idx] : label,
            color: color[idx],
          }));
        }}
      />
    );
  })
  .addWithInfo('Logairthmic - Updating', () => (
    <LineGraphContainer
      datasets={createDataSets(4, 5)}
      scaleType="log"
      // onHover={action('Hover')}
      // onMouseOut={action('Mouseout')}
      // onBlur={action('Blur')}
      seriesLabels={Array.from({ length: 4 }, (v, k) => `Series ${k}`)}
      showLegend
      hoverOverlay
      multiValueTooltip
      timeFormat="%b"
      formatTooltipData={({ datasets, data, seriesLabels, label, color }) => {
        const dataSets = flatMap(datasets, v =>
          v.filter(d => d.includes(data[data.length - 1]))
        );
        return dataSets.map((dataSet, idx) => ({
          data: dataSet[0],
          label:
            seriesLabels && seriesLabels.length ? seriesLabels[idx] : label,
          color: color[idx],
        }));
      }}
    />
  ))
  .addWithInfo('Empty', ` Empty Example. `, () => (
    <LineGraph
      onHover={action('Hover')}
      onMouseOut={action('Mouseout')}
      onBlur={action('Blur')}
    />
  ));
