import React, { PureComponent } from 'react';
import { storiesOf, action } from '@storybook/react';
import BubbleChart from './BubbleChart';

class UpdatingBubbleChartContainer extends PureComponent {
  state = {
    data: createData(6).sort((a, b) => b[0] - a[0]),
  };

  updateInterval;

  componentDidMount() {
    let i = 0;
    this.updateInterval = setInterval(() => {
      this.updateData(i);
      i++;
    }, 2500);
  }

  componentWillUnmount() {
    clearInterval(this.updateInterval);
  }

  updateData(i) {
    let data = createData(6).sort((a, b) => b[0] - a[0]);
    action('Update');
    this.setState({
      data,
      xAxisLabel: `${i}`,
      yAxisLabel: `${i}`,
    });
  }

  render() {
    const { data } = this.state;
    const props = {
      data,
      margin: {
        top: 30,
        right: 20,
        bottom: 70,
        left: 65,
      },
      height: 450,
      width: 800,
      labelOffset: 55,
      axisOffset: 16,
      xAxisLabel: 'Airline',
      yAxisLabel: 'USAGE ($)',
      timeFormat: null,
    };

    return <BubbleChart {...props} />;
  }
}

function createData(num) {
  let data = [];
  for (let i = 0; i < num; i++) {
    let randomNum = Math.floor(Math.random() * 1000 + 1);
    data.push([randomNum, i]);
  }

  return data;
}

const data = createData(7).sort((a, b) => b[0] - a[0]);
const props = {
  margin: {
    top: 30,
    right: 20,
    bottom: 70,
    left: 65,
  },
  data,
  height: 450,
  width: 800,
  labelOffset: 55,
  axisOffset: 16,
  xAxisLabel: 'Airline',
  formatValue: null,
  timeFormat: null,
  formatTooltipData: ({ data, label, index, circle }) => {
    return [
      {
        data: `$${data[0] / 10}`,
        index,
        label,
        color: circle.attr('fill'),
      },
    ];
  },
};

storiesOf('BubbleChart', module)
  .addWithInfo(
    'Default',
    `
      Bubble Chart.
    `,
    () => <BubbleChart data={data} onHover={action('Hover')} {...props} />
  )
  .addWithInfo(
    'Even Spacing',
    `
      Bubble Chart.
    `,
    () => <BubbleChart onHover={action('Hover')} spacing="even" {...props} />
  )
  .addWithInfo(
    'Resizing',
    `
      Auto resizing Bubble Chart.
    `,
    () => {
      class ResizingChart extends PureComponent {
        state = {
          data: createData(6).sort((a, b) => b[0] - a[0]),
        };

        chartRef = React.createRef();
        resizeInterval;

        componentDidMount() {
          this.resizeInterval = setInterval(() => {
            const height = Math.max(
              Math.min(Math.random() * 1000, props.height),
              300
            );
            const width = Math.max(
              Math.min(Math.random() * 1000, props.width),
              300
            );
            this.setState({ data: createData(6).sort((a, b) => b[0] - a[0]) });
            this.chartRef.current.resize(height, width);
          }, 2500);
        }

        componentWillUnmount() {
          clearInterval(this.resizeInterval);
        }

        render() {
          const { data } = this.state;

          return (
            <BubbleChart
              ref={this.chartRef}
              {...props}
              data={data}
              spacing="even"
            />
          );
        }
      }

      return <ResizingChart />;
    }
  )
  .addWithInfo(
    'Updating',
    `
     Updating Bubble Chart.
    `,
    () => <UpdatingBubbleChartContainer />
  );
