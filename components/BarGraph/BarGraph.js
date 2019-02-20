import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import DataTooltip from '../DataTooltip/DataTooltip';
import * as d3 from 'd3';
import _ from 'lodash';

const propTypes = {
  data: PropTypes.array,
  height: PropTypes.number,
  width: PropTypes.number,
  id: PropTypes.string,
  containerId: PropTypes.string,
  margin: PropTypes.object,
  labelOffsetX: PropTypes.number,
  labelOffsetY: PropTypes.number,
  axisOffset: PropTypes.number,
  timeFormat: PropTypes.string,
  xDomain: PropTypes.number,
  xAxisLabel: PropTypes.string,
  yAxisLabel: PropTypes.string,
  onHover: PropTypes.func,
  onMouseOut: PropTypes.func,
  emptyText: PropTypes.string,
  color: PropTypes.array,
  showTooltip: PropTypes.bool,
  enableLabelWrapping: PropTypes.bool,
};

const defaultProps = {
  data: [[12, 1507563900000]],
  height: 300,
  width: 800,
  id: 'container',
  containerId: 'graph-container',
  margin: {
    top: 30,
    right: 20,
    bottom: 70,
    left: 65,
  },
  labelOffsetX: 65,
  labelOffsetY: 55,
  axisOffset: 16,
  timeFormat: null,
  xDomain: null,
  enableLabelWrapping: false,
  xAxisLabel: 'X Axis',
  yAxisLabel: 'Y Axis',
  onHover: () => {},
  formatValue: null,
  formatTooltipData: ({ data, seriesLabels, label, index, rect }) => {
    return [
      {
        data: data[0],
        label: seriesLabels ? seriesLabels[index] : label,
        color: rect.attr('fill'),
      },
    ];
  },
  emptyText: `There is currently no data available for the parameters selected.
    Please try a different combination.`,
  color: ['#00A78F', '#3b1a40', '#473793', '#3c6df0', '#56D2BB'],
  showTooltip: true,
};

class BarGraph extends Component {
  constructor(props) {
    super(props);
    const { width, height, margin } = this.props;

    this.width = width - (margin.left + margin.right);
    this.height = height - (margin.top + margin.bottom);
    this.color = d3.scaleOrdinal(this.props.color);
  }

  componentDidMount() {
    const { width, height, margin, containerId, emptyText } = this.props;

    this.emptyContainer = d3
      .select(`#${containerId} .bx--bar-graph-empty-text`)
      .text(emptyText)
      .style('position', 'absolute')
      .style('top', '50%')
      .style('left', '50%')
      .style('text-align', 'center')
      .style('transform', 'translate(-50%, -50%)');

    this.svg = d3
      .select(`#${containerId} svg`)
      .attr('class', 'bx--graph')
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('class', 'bx--group-container')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    this.initialRender();
  }

  shouldComponentUpdate(nextProps) {
    return !_.isEqual(this.props, nextProps);
  }

  componentDidUpdate() {
    const { margin, height, width, containerId } = this.props;
    this.height = height - (margin.top + margin.bottom);
    this.width = width - (margin.left + margin.right);
    this.svg.selectAll('.bx--group-container > g').remove();
    d3.select(`#${containerId} svg`)
      .attr('width', width)
      .attr('height', height)
      .select('.bx--group-container')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);
    this.initialRender();
  }

  initialRender() {
    const { data, timeFormat, xDomain, formatValue } = this.props;

    this.updateEmptyState(data);

    const dataLength = d3.max(data, d => d[0].length);
    this.isGrouped = dataLength > 1;

    this.x = d3
      .scaleBand()
      .rangeRound([0, this.width])
      .domain(data.map(d => d[1]))
      .padding(0.3);

    if (this.isGrouped) {
      this.x1 = d3
        .scaleBand()
        .rangeRound([0, this.x.bandwidth()])
        .domain(d3.range(dataLength))
        .padding(0.05);

      this.y = d3
        .scaleLinear()
        .range([this.height, 0])
        .domain([
          0,
          xDomain !== null ? xDomain : d3.max(data, d => d3.max(d[0], i => i)),
        ]);
    } else {
      this.y = d3
        .scaleLinear()
        .range([this.height, 0])
        .domain([0, xDomain !== null ? xDomain : d3.max(data, d => d[0][0])]);
    }

    this.xAxis = d3
      .axisBottom()
      .scale(this.x)
      .tickSize(0);

    if (timeFormat !== null) {
      this.xAxis.tickFormat(d3.timeFormat(timeFormat));
    }

    this.yAxis = d3
      .axisLeft()
      .ticks(4)
      .tickSize(-this.width)
      .scale(this.y.nice());

    if (formatValue !== null) {
      this.yAxis.tickFormat(formatValue);
    }

    this.renderAxes();
    this.renderLabels();

    if (this.x) {
      this.renderBars();
    }
  }

  wrapText(el) {
    const { data, timeFormat, enableLabelWrapping, margin } = this.props;
    if (!enableLabelWrapping) return el;
    const itemSpace = this.width / data.length;
    const transformMatrix = new WebKitCSSMatrix(
      getComputedStyle(el.parentElement).webkitTransform
    );
    const wrapText = function() {
      const self = d3.select(this);
      let textLength = self.node().getComputedTextLength();
      let text = self.text();
      let padding = 8;
      while (
        textLength > itemSpace - 2 * Math.min(padding, 20) &&
        text.length > 0
      ) {
        text = text.slice(0, -1);
        self.text(text + '...');
        textLength = self.node().getComputedTextLength();
        if (itemSpace - textLength < 0) {
          padding += 1;
        }
      }
    };

    d3.select(el)
      .on('mouseover', d => {
        ReactDOM.render(
          <DataTooltip
            className="legend-text"
            data={[
              {
                data: timeFormat !== null ? d3.timeFormat(timeFormat)(d) : d,
              },
            ]}
            direction="bottom"
          />,
          this.tooltipId
        );
        const tooltipWidth = (this.tooltipId && this.tooltipId.children)
          ? this.tooltipId.children[0].clientWidth
          : 100;
        d3.select(this.tooltipId)
          .style('position', 'relative')
          .style(
            'transform',
            `translate(
              ${Math.abs(
                margin.left + transformMatrix.m41 - tooltipWidth / 2
              )}px,
              0
            )`
          );
      })
      .on('mouseout', () => {
        d3.select(this.tooltipId).attr('style', '');
        ReactDOM.unmountComponentAtNode(this.tooltipId);
      });

    return wrapText.call(el);
  }

  renderAxes() {
    const { axisOffset } = this.props;
    const _this = this;

    this.svg
      .append('g')
      .attr('class', 'bx--axis bx--axis--y')
      .attr('stroke-dasharray', '4')
      .call(this.yAxis)
      .selectAll('text')
      .attr('x', -axisOffset);
    this.svg
      .append('g')
      .attr('class', 'bx--axis bx--axis--x')
      .attr('transform', `translate(0, ${this.height})`)
      .call(this.xAxis)
      .selectAll('.tick text')
      .each(function() {
        return _this.wrapText.call(_this, this);
      })
      .attr('y', axisOffset)
      .style('text-anchor', 'middle');

    this.updateStyles();
  }

  renderBars() {
    const { data } = this.props;

    const barContainer = this.svg.append('g').attr('class', 'bar-container');

    if (data.length) {
      if (this.isGrouped) {
        this.count = 0;
        barContainer
          .selectAll('g')
          .data(data)
          .enter()
          .append('g')
          .attr('transform', d => `translate(${this.x(d[1])}, 0)`)
          .selectAll('rect')
          .data(d => {
            this.count++;
            let itemLabel = d[1];
            return d[0].map((key, index) => {
              return {
                key,
                index,
                group: this.count - 1,
                itemLabel,
              };
            });
          })
          .enter()
          .append('rect')
          .attr('class', 'bar')
          .attr('x', d => this.x1(d.index))
          .attr('y', this.height)
          .attr('width', this.x1.bandwidth())
          .attr('height', 0)
          .attr('fill', d => this.color(d.index))
          .attr('data-bar', d => `${d.index}-${d.group}`)
          .transition()
          .duration(500)
          .delay((d, i) => i * 50)
          .attr('y', d => this.y(d.key))
          .attr('height', d => this.height - this.y(d.key));
      } else {
        barContainer
          .selectAll('rect')
          .data(data)
          .enter()
          .append('rect')
          .attr('class', 'bar')
          .attr('x', d => this.x(d[1]))
          .attr('y', this.height)
          .attr('height', 0)
          .attr('width', this.x.bandwidth())
          .attr('fill', (d, i) => this.color(i % this.props.color.length))
          .attr('data-bar', (d, i) => `${i}-0`)
          .transition()
          .duration(500)
          .delay((d, i) => i * 50)
          .attr('y', d => this.y(d[0]))
          .attr('height', d => this.height - this.y(d[0]));
      }

      barContainer
        .selectAll('rect')
        .on('mouseover', (d, i) => this.onMouseEnter(d, i))
        .on('mouseout', (d, i) => this.onMouseOut(d, i));
    }
  }

  renderLabels() {
    const { labelOffsetY, labelOffsetX, xAxisLabel, yAxisLabel } = this.props;

    this.svg
      .select('.bx--axis--y')
      .append('text')
      .text(`${yAxisLabel}`)
      .attr('class', 'bx--graph-label')
      .attr(
        'transform',
        `translate(${-labelOffsetY}, ${this.height / 2}) rotate(-90)`
      );

    this.svg
      .select('.bx--axis--x')
      .append('text')
      .text(`${xAxisLabel}`)
      .attr('class', 'bx--graph-label')
      .attr('transform', `translate(${this.width / 2}, ${labelOffsetX})`);

    this.svg
      .selectAll('.bx--graph-label')
      .attr('font-size', '10')
      .attr('font-weight', '700')
      .attr('fill', '#5A6872')
      .attr('text-anchor', 'middle');
  }

  getMouseData(d, i) {
    let mouseData;

    if (d.key) {
      mouseData = {
        data: [d.key],
        index: d.index,
        group: d.group,
        label: d.itemLabel,
      };
    } else {
      mouseData = {
        data: [d[0][0]] || [d[0]],
        index: i,
        group: 0,
        label: d[1],
      };
    }

    return mouseData;
  }

  onMouseEnter(d, i) {
    const {
      timeFormat,
      showTooltip,
      height,
      labelOffsetX,
      seriesLabels,
    } = this.props;
    const mouseData = this.getMouseData(d, i);

    let rect = this.svg.select(
      `rect[data-bar="${mouseData.index}-${mouseData.group}"]`
    );
    rect.attr('fill', d3.color(rect.attr('fill')).darker());

    const xVal = mouseData.label;
    if (timeFormat) {
      const format = d3.timeFormat(timeFormat);

      mouseData.label = format(mouseData.label);
    }

    this.props.onHover(mouseData);

    const tooltipData = this.props.formatTooltipData(
      Object.assign(mouseData, {
        rect,
        seriesLabels,
      })
    );

    if (showTooltip) {
      ReactDOM.render(<DataTooltip data={tooltipData} />, this.tooltipId);
      const tooltipSize = d3
        .select(this.tooltipId.children[0])
        .node()
        .getBoundingClientRect();
      const offset = -tooltipSize.width / 2;

      d3.select(this.tooltipId)
        .style('position', 'relative')
        .style(
          'left',
          `${this.x(xVal) +
            (this.x1 ? this.x1(mouseData.index) : 0) +
            labelOffsetX +
            offset +
            (this.x1 ? this.x1.bandwidth() / 2 : this.x.bandwidth() / 2)}px`
        )
        .style(
          'top',
          `${this.y(mouseData.data[0]) - height - tooltipSize.height + 10}px`
        );
    }
  }

  onMouseOut(d, i) {
    const mouseData = this.getMouseData(d, i);

    let rect = this.svg.select(
      `rect[data-bar="${mouseData.index}-${mouseData.group}"]`
    );

    rect
      .transition()
      .duration(500)
      .attr(
        'fill',
        () =>
          this.isGrouped
            ? this.color(mouseData.index)
            : this.color(mouseData.index % this.props.color.length)
      );
    d3.select(this.tooltipId).attr('style', '');
    ReactDOM.unmountComponentAtNode(this.tooltipId);
  }

  updateEmptyState(data) {
    if (!data.length) {
      this.svg.style('opacity', '.3');
      this.emptyContainer.style('display', 'inline-block');
    } else {
      this.svg.style('opacity', '1');
      this.emptyContainer.style('display', 'none');
    }
  }

  updateStyles() {
    this.svg.selectAll('.bx--axis--y path').style('display', 'none');
    this.svg.selectAll('.bx--axis path').attr('stroke', '#5A6872');
    this.svg.selectAll('.tick line').attr('stroke', '#5A6872');
    this.svg.selectAll('.tick text').attr('fill', '#5A6872');
  }

  render() {
    const { id, containerId } = this.props;

    return (
      <div
        className="bx--graph-container"
        id={containerId}
        style={{ position: 'relative' }}>
        <p className="bx--bar-graph-empty-text" />
        <svg id={id} />
        <div
          className="bx--graph-tooltip"
          id="tooltip-div"
          ref={id => (this.tooltipId = id)}
        />
      </div>
    );
  }
}

BarGraph.propTypes = propTypes;
BarGraph.defaultProps = defaultProps;

export default BarGraph;
