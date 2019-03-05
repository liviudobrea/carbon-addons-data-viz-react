import PropTypes from 'prop-types';
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import * as d3 from 'd3';
import DataTooltip from '../DataTooltip/DataTooltip';
import _ from 'lodash';

const propTypes = {
  /**
   * If your data set has a single series, or multiple series with all the same x values, use the data prop, and format like this: [[y1a, y1b, ... , x1], [y2a, y2b, ... , x2], ...]
   */
  data: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.number, PropTypes.string]))
  ),
  /**
   * If your data set has multiple series with different x values, use the datasets prop, and format like this: [[[y1a, x1a], [y2a, x2a], ...], [[y1b, x1b], [y2b, x2b], ...], ...]
   */
  datasets: PropTypes.arrayOf(
    PropTypes.arrayOf(
      PropTypes.arrayOf(
        PropTypes.oneOfType([PropTypes.number, PropTypes.string])
      )
    )
  ),
  /**
   * If your data set has multiple series, the seriesLabels array should contain strings labeling your series in the same order that your series appear in either data or datasets props.
   */
  seriesLabels: PropTypes.arrayOf(PropTypes.string),
  timeFormatLocale: PropTypes.shape({
    dateTime: PropTypes.string,
    date: PropTypes.string,
    time: PropTypes.string,
    periods: PropTypes.arrayOf(PropTypes.string),
    days: PropTypes.arrayOf(PropTypes.string),
    shortDays: PropTypes.arrayOf(PropTypes.string),
    months: PropTypes.arrayOf(PropTypes.string),
    shortMonths: PropTypes.arrayOf(PropTypes.string),
  }),
  height: PropTypes.number,
  width: PropTypes.number,
  id: PropTypes.string,
  containerId: PropTypes.string,
  margin: PropTypes.object,
  labelOffsetX: PropTypes.number,
  labelOffsetY: PropTypes.number,
  axisOffset: PropTypes.number,
  timeFormat: PropTypes.string,
  xAxisLabel: PropTypes.string,
  yAxisLabel: PropTypes.string,
  onHover: PropTypes.func,
  onMouseOut: PropTypes.func,
  emptyText: PropTypes.string,
  isUTC: PropTypes.bool,
  color: PropTypes.array,
  drawLine: PropTypes.bool,
  animateAxes: PropTypes.bool,
  showTooltip: PropTypes.bool,
  multiValueTooltip: PropTypes.bool,
  showLegend: PropTypes.bool,
  formatValue: PropTypes.func,
  formatTooltipData: PropTypes.func,

  /**
   * Displays overlay on top of chart slice when hovering specific area
   */
  hoverOverlay: PropTypes.bool,

  /**
   * Defines the scale of the line chart (oneOf('linear', 'log'))
   */
  scaleType: PropTypes.string,
  /**
   * Set this prop to false to prevent x values from being converted to time.
   */
  isXTime: PropTypes.bool,

  xDomain: PropTypes.arrayOf(PropTypes.number),
  yDomain: PropTypes.arrayOf(PropTypes.number),
  yAxisTicks: PropTypes.number,
};

const defaultProps = {
  data: [],
  datasets: [],
  seriesLabels: [],
  height: 300,
  width: 800,
  id: 'container',
  containerId: 'graph-container',
  hoverOverlay: false,
  multiValueTooltip: false,
  margin: {
    top: 30,
    right: 20,
    bottom: 70,
    left: 65,
  },
  labelOffsetX: 65,
  labelOffsetY: 55,
  axisOffset: 16,
  timeFormat: '%I:%M:%S',
  xAxisLabel: 'X Axis',
  yAxisLabel: 'Y Axis',
  yAxisTicks: 4,
  scaleType: 'linear',
  xDomain: [],
  yDomain: [],
  onHover: () => {},
  onMouseOut: () => {},
  formatValue: null,
  formatTooltipData: ({ data, seriesLabels, index, label, color }) => {
    return [
      {
        data: data[0],
        label:
          seriesLabels && seriesLabels.length ? seriesLabels[index] : label,
        color: color[index],
      },
    ];
  },
  emptyText:
    'There is currently no data available for the parameters selected. Please try a different combination.',
  isUTC: false,
  color: ['#00a68f', '#3b1a40', '#473793', '#3c6df0', '#56D2BB'],
  drawLine: true,
  animateAxes: true,
  showTooltip: true,
  showLegend: false,
  isXTime: true,
};

class LineGraph extends Component {
  constructor(props) {
    super(props);
    const {
      width,
      height,
      margin,
      showLegend,
      data,
      datasets,
      seriesLabels,
    } = this.props;

    this.width =
      width -
      (margin.left +
        margin.right +
        (showLegend && seriesLabels.length > 0
          ? 30 + _.max(seriesLabels.map(l => l.length)) * 8
          : 0));
    this.height = height - (margin.top + margin.bottom);

    this.color = d3.scaleOrdinal(this.props.color);
    this.mapData = this.mapData.bind(this);
    this.tickFormat = this.tickFormat.bind(this);
    this.flatData =
      data.length > 0
        ? data.map(this.mapData)
        : _.flatten(datasets.map(dataset => dataset.map(this.mapData)));
  }

  componentDidMount() {
    const { width, height, margin, containerId, emptyText } = this.props;

    this.emptyContainer = d3
      .select(`#${containerId} .bx--line-graph-empty-text`)
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
    const {
      margin,
      seriesLabels,
      datasets,
      data,
      height,
      showLegend,
      width,
      containerId,
    } = this.props;

    this.width =
      width -
      (margin.left +
        margin.right +
        (showLegend && seriesLabels.length > 0
          ? 30 + _.max(seriesLabels.map(l => l.length)) * 8
          : 0));
    this.height = height - (margin.left + margin.right);
    this.flatData =
      data.length > 0
        ? data.map(this.mapData)
        : _.flatten(datasets.map(dataset => dataset.map(this.mapData)));
    this.svg.selectAll('.bx--group-container > *').remove();
    d3.select(`#${containerId} svg`)
      .attr('width', width)
      .attr('height', height)
      .select('.bx--group-container')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    this.initialRender();
  }

  updateEmptyState(data) {
    if (
      data[0]
        ? (!Array.isArray(data[0][0]) && !data.length) ||
          (Array.isArray(data[0][0]) && _.max(data.map(d => d.length)) === 0)
        : true
    ) {
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

  mapData(d) {
    const { isXTime, isUTC } = this.props;
    const date = d[d.length - 1];
    if (isXTime || isUTC) {
      return { rawDate: date, date: new Date(date), value: d[0] };
    }
    return { rawDate: date, date, value: d[0] };
  }

  tickFormat(d) {
    const { isUTC, isXTime, timeFormat } = this.props;

    if (timeFormat) {
      if (isUTC) {
        return d3.utcFormat(timeFormat)(d);
      }
      if (isXTime) {
        return d3.timeFormat(timeFormat)(d);
      }
    }
    return d;
  }

  initialRender() {
    const {
      data,
      datasets,
      formatValue,
      isUTC,
      isXTime,
      showLegend,
      seriesLabels,
      scaleType,
      yDomain,
      yAxisTicks,
      xDomain,
      timeFormatLocale,
    } = this.props;

    this.updateEmptyState(data.length > 0 ? data : datasets);

    if (isUTC) {
      this.x = d3.scaleUtc();
    } else if (isXTime) {
      this.x = d3.scaleTime();
    } else {
      this.x = d3.scaleLinear();
    }

    this.x.range([0, this.width]).domain(d3.extent(this.flatData, d => d.date));

    if (xDomain.length === 2) {
      this.x.domain([xDomain[0], xDomain[1]]);
    }

    if (scaleType === 'log') {
      this.y = d3
        .scaleLog()
        .range([this.height, 0])
        .domain([
          yDomain[0] || 0.1,
          yDomain[1] || d3.max(this.flatData, d => d.value),
        ]);
    } else {
      this.y = d3
        .scaleLinear()
        .range([this.height, 0])
        .domain([
          yDomain[0] || 0,
          yDomain[1] || d3.max(this.flatData, d => d.value),
        ]);
    }

    this.line = d3
      .line()
      .x(d => this.x(d[1]))
      .y(d => this.y(d[0]))
      .defined(d => !isNaN(d[0]));

    if (timeFormatLocale) {
      d3.timeFormatDefaultLocale(timeFormatLocale);
    }

    this.xAxis = d3
      .axisBottom()
      .scale(this.x.nice())
      .ticks(d3.max(datasets.map(v => v.length).concat(data.length)))
      .tickSize(0)
      .tickFormat(this.tickFormat);

    this.yAxis = d3
      .axisLeft()
      .scale(this.y.nice())
      .tickSize(-this.width)
      .ticks(yAxisTicks);

    if (scaleType === 'log') {
      this.yAxis.tickFormat(d3.format('~s'));
    } else if (formatValue !== null) {
      this.yAxis.tickFormat(formatValue);
    }

    this.renderAxes();
    this.renderLabels();
    this.renderOverlay();

    if (this.x) {
      this.renderLines();
    }

    if (showLegend && seriesLabels.length > 0) {
      this.renderLegend();
    }
  }

  renderAxes() {
    const { axisOffset } = this.props;

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
      .selectAll('text')
      .attr('y', axisOffset)
      .attr('text-anchor', 'end')
      .style(
        'transform',
        `translate3d(-${axisOffset}px, 5px, 0) rotate(-60deg)`
      );

    this.updateStyles();
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

  renderLines() {
    const { data, datasets, drawLine } = this.props;
    const color = d3.scaleOrdinal(this.props.color);
    const hasData = data.length > 0;
    const numLines = hasData ? data[0].length - 1 : datasets.length;

    const lineContainer = this.svg.append('g').attr('class', 'line-container');

    if (hasData || _.max(datasets.map(d => d.length)) > 0) {
      for (let i = 0; i < numLines; i++) {
        const path = lineContainer
          .append('g')
          .attr('data-line', i)
          .datum(hasData ? data : datasets[i])
          .append('path')
          .attr('class', 'bx--line')
          .attr('stroke', color(i))
          .attr('stroke-width', 2)
          .attr('fill', 'none')
          .attr('pointer-events', 'none')
          .attr('d', this.line);

        let totalLength = path.node().getTotalLength();

        if (drawLine) {
          path
            .attr('stroke-dasharray', 0 + ' ' + totalLength)
            .transition()
            .ease(d3.easeSin)
            .duration(1000)
            .attr('stroke-dasharray', totalLength + ' ' + 0);
        } else {
          path
            .attr('stroke-dasharray', 0 + ' ' + totalLength)
            .attr('stroke-dasharray', totalLength + ' ' + 0);
        }
      }
    }
  }

  renderOverlay() {
    const { hoverOverlay } = this.props;
    if (hoverOverlay) {
      this.overlay = this.svg
        .append('rect')
        .attr('class', 'bx--graph-overlay')
        .attr('fill', '#3d70b2')
        .style('opacity', '.1')
        .attr('height', this.height);
    }

    this.svg
      .append('rect')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('class', 'overlay')
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .on('mouseover', this.onMouseMove.bind(this))
      .on('mousemove', this.onMouseMove.bind(this))
      .on('mouseout', this.onMouseOut.bind(this));
  }

  renderLegend() {
    const { seriesLabels } = this.props;
    let legendRectSize = 10;
    let legendXSpacing = 10;
    let legendYSpacing = 14;

    const legendContainer = this.svg
      .append('g')
      .attr('class', 'legend-container')
      .style('transform', `translateX(650px)`);

    const legend = legendContainer
      .selectAll('.legend')
      .data(seriesLabels)
      .enter()
      .append('g')
      .attr('class', 'legend')
      .attr('transform', (d, i) => {
        const h = legendRectSize + legendYSpacing;
        const offset = (h * seriesLabels.length) / 2;
        const vert = i * h - offset + 50;
        return `translate(0, ${vert})`;
      });

    legend
      .append('rect')
      .attr('width', legendRectSize)
      .attr('height', legendRectSize)
      .attr('x', 0)
      .attr('y', 0)
      .style('fill', (d, i) => this.props.color[i])
      .style('stroke', (d, i) => this.props.color[i]);

    legend
      .append('text')
      .attr('x', legendRectSize + legendXSpacing)
      .attr('y', legendRectSize)
      .text((d, i) => seriesLabels[i]);
  }

  getOffset(el) {
    if (!el) return { top: 0, left: 0, right: 0, width: 0 };
    const rect = el.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft =
      window.pageXOffset || document.documentElement.scrollLeft;
    return {
      top: rect.top + scrollTop,
      left: rect.left + scrollLeft,
      right:
        document.documentElement.clientWidth -
        rect.width -
        (rect.left + scrollLeft),
      width: rect.width,
      height: rect.height,
    };
  }

  onMouseOut() {
    const { hoverOverlay, data, datasets, showTooltip } = this.props;
    const tooltipChild = this.tooltipId.children[0];
    const mouseOut = this.onMouseOut.bind(this);
    if (showTooltip) {
      if (tooltipChild) {
        d3.select(tooltipChild).on('mouseout', null);
      }
      const { pageX, pageY } = d3.event;
      const tooltipOffset = this.getOffset(tooltipChild);
      if (
        pageX >= tooltipOffset.left &&
        pageX <= tooltipOffset.left + tooltipOffset.width &&
        pageY >= tooltipOffset.top &&
        pageY <= tooltipOffset.top + tooltipOffset.height
      ) {
        d3.select(tooltipChild).on('mouseout', mouseOut);
        return;
      }
    }

    if (hoverOverlay) {
      this.overlay.style('display', 'none');
    }
    if (data.length > 2 || _.max(datasets.map(d => d.length)) > 2) {
      this.props.onMouseOut();
      if (this.tooltipId) {
        ReactDOM.unmountComponentAtNode(this.tooltipId);
      }
    }
  }

  onMouseMove() {
    if (!this.svgNode) return null;

    const {
      margin,
      data,
      datasets,
      showTooltip,
      timeFormat,
      color,
      height,
      labelOffsetX,
      isXTime,
      seriesLabels,
      hoverOverlay,
      formatTooltipData,
      multiValueTooltip,
    } = this.props;

    if (data.length > 2 || _.max(datasets.map(d => d.length)) > 2) {
      const bisectDate = d3.bisector(d => d[d.length - 1]).right;
      const mouse = d3.mouse(this.svgNode)[0] - margin.left;
      const timestamp = this.x.invert(mouse);
      let d, mouseData, tooltipHeading, tooltipData;
      if (data.length > 0) {
        const index = bisectDate(data, timestamp, 1);
        const d0 = data[index - 1];
        const d1 = data[index];

        if (d0 && d1) {
          d =
            timestamp - d0[d0.length - 1] > d1[d1.length - 1] - timestamp
              ? d1
              : d0;
          const { pageX, pageY } = d3.event;
          mouseData = {
            data: d,
            datasets,
            pageX,
            pageY,
            graphX: this.x(d[d.length - 1]),
            graphY: this.y(d[0]),
            graphYArray: d.slice(0, -1).map(this.y),
          };

          if (hoverOverlay) {
            const startDate = d0[d0.length - 1];
            const endDate = d1[d1.length - 1];
            const x0 = this.x(d[d.length - 1]);
            let overlayWidth = Math.abs(this.x(endDate) - this.x(startDate));
            let xPos = Math.min(Math.max(0, x0 - overlayWidth / 2), this.width);
            if (d[d.length - 1] === data[0][1]) {
              overlayWidth = overlayWidth / 2 + x0;
            } else if (d[d.length - 1] === data[data.length - 1][1]) {
              overlayWidth = overlayWidth / 2 + this.width - x0;
            }
            this.overlay
              .style('display', 'inherit')
              .attr('width', overlayWidth)
              .attr('x', xPos);
          }

          tooltipHeading =
            d.length > 2 || multiValueTooltip
              ? isXTime
                ? d3.timeFormat(timeFormat)(d[d.length - 1])
                : d[d.length - 1]
              : null;

          tooltipData = formatTooltipData(
            Object.assign(mouseData, {
              index,
              label: tooltipHeading,
              seriesLabels,
              color,
            })
          );
        }
      } else {
        const mouseX = this.x(timestamp);
        const mouseY = d3.mouse(this.svgNode)[1] - margin.top;
        const distances = [];
        d = _.sortBy(this.flatData, a => {
          const aDist =
            Math.pow(mouseX - this.x(a.date), 2) +
            Math.pow(mouseY - this.y(a.value), 2);
          distances.push({ a, aDist });
          return aDist;
        })[0];
        const i = datasets.findIndex(set =>
          set.some(s => s[0] === d.value && s[1] === d.rawDate)
        );

        if (hoverOverlay) {
          const x0 = this.x(d.date);
          const endDate = d.rawDate;
          const endDateIdx = datasets[i].findIndex(
            v => v[v.length - 1] === endDate
          );
          const datasetLength = datasets
            .map(v => v.length)
            .sort((a, b) => b - a)
            .shift();
          let startSet, startDate, overlayWidth, xPos;
          if (endDateIdx === 0) {
            startSet = datasets[i][1];
            startDate = startSet[startSet.length - 1];
            overlayWidth = Math.abs(this.x(d.date) - this.x(startDate));
            xPos = Math.min(Math.max(0, x0 - overlayWidth / 2), this.width);
            overlayWidth = Math.min(overlayWidth, overlayWidth / 2 + x0);
          } else {
            startSet = datasets[i][Math.max(endDateIdx - 1, 0)];
            startDate = startSet[startSet.length - 1];
            overlayWidth = Math.abs(this.x(d.date) - this.x(startDate));
            xPos = Math.min(Math.max(0, x0 - overlayWidth / 2), this.width);
            if (endDateIdx === datasetLength - 1) {
              overlayWidth = Math.min(
                overlayWidth,
                overlayWidth / 2 + this.width - x0
              );
            }
          }
          this.overlay
            .style('display', 'inherit')
            .attr('width', overlayWidth)
            .attr('x', xPos);
        }

        const { pageX, pageY } = d3.event;

        mouseData = {
          data: datasets[i].find(v => v[0] === d.value && v[1] === d.rawDate),
          datasets,
          pageX,
          pageY,
          graphX: this.x(d.date),
          graphY: this.y(d.value),
          graphYArray: [d.value].map(this.y),
        };

        const xVal = isXTime ? d3.timeFormat(timeFormat)(d.date) : d.date;

        tooltipHeading = d.value.length > 2 || multiValueTooltip ? xVal : null;

        tooltipData = formatTooltipData(
          Object.assign(mouseData, {
            index: i,
            label: tooltipHeading,
            seriesLabels,
            color,
          })
        );
      }

      this.props.onHover(mouseData);

      if (showTooltip && tooltipData && tooltipData.length > 0) {
        ReactDOM.render(
          <DataTooltip heading={tooltipHeading} data={tooltipData} />,
          this.tooltipId
        );
        const tooltipSize = d3
          .select(this.tooltipId.children[0])
          .node()
          .getBoundingClientRect();
        const offset = -tooltipSize.width / 2;
        const value = Array.isArray(d) ? _.max(_.dropRight(d)) : d.value;
        d3.select(this.tooltipId)
          .style('position', 'relative')
          .style('left', `${mouseData.graphX + labelOffsetX + offset}px`)
          .style(
            'top',
            `${this.y(value) - height - tooltipSize.height + 10}px`
          );
      }
    }
  }

  render() {
    const { id, containerId } = this.props;

    return (
      <div
        className="bx--graph-container"
        id={containerId}
        style={{ position: 'relative' }}>
        <p className="bx--line-graph-empty-text" />
        <svg id={id} ref={node => (this.svgNode = node)} />
        <div id={`${id}-tooltip`} ref={id => (this.tooltipId = id)} />
      </div>
    );
  }
}

LineGraph.propTypes = propTypes;
LineGraph.defaultProps = defaultProps;

export default LineGraph;
