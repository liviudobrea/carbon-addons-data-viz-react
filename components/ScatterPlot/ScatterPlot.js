import PropTypes from 'prop-types';
import React, { Component } from 'react';
import * as d3 from 'd3';

const propTypes = {
  data: PropTypes.array,
  height: PropTypes.number,
  width: PropTypes.number,
  margin: PropTypes.object,
  labelOffset: PropTypes.number,
  axisOffset: PropTypes.number,
  timeFormat: PropTypes.string,
  xAxisLabel: PropTypes.string,
  yAxisLabel: PropTypes.string,
  id: PropTypes.string,
  containerId: PropTypes.string,
  emptyText: PropTypes.string,
};

const defaultProps = {
  data: [[100, 10], [50, 20]],
  height: 300,
  width: 800,
  margin: {
    top: 30,
    right: 20,
    bottom: 70,
    left: 65,
  },
  labelOffset: 55,
  axisOffset: 16,
  timeFormat: '%b',
  xAxisLabel: 'X Axis',
  yAxisLabel: 'Y Axis',
  id: 'container',
  containerId: 'graph-container',
  emptyText:
    'There is currently no data available for the parameters ' +
    'selected. Please try a different combination.',
};

class ScatterPlot extends Component {
  state = {
    data: this.props.data,
    height: this.props.height,
    width: this.props.width,
    margin: this.props.margin,
    labelOffset: this.props.labelOffset,
    axisOffset: this.props.axisOffset,
    timeFormat: this.props.timeFormat,
    xAxisLabel: this.props.xAxisLabel,
    yAxisLabel: this.props.yAxisLabel,
  };

  componentDidMount() {
    const { width, height, margin } = this.state;
    const { containerId, emptyText } = this.props;

    this.emptyContainer = d3
      .select(`#${containerId} .bx--scatter-plot-empty-text`)
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

    this.setState(() => {
      return {
        width: width - (margin.left + margin.right),
        height: height - (margin.top + margin.bottom),
      };
    }, this.initialRender);
  }

  componentDidUpdate(prevProps) {
    const { showLegend, seriesLabels, data } = this.props;

    // If seriesLabels change, remove legend and re-render
    if (showLegend && seriesLabels.length !== prevProps.seriesLabels.length) {
      // this.svg.selectAll('.legend').remove();
    }

    this.updateEmptyState(data);
  }

  updateData(nextProps) {
    const { axisOffset, xAxisLabel, yAxisLabel } = nextProps;

    this.svg.selectAll('g.line-container').remove();

    this.svg
      .select('.bx--axis--x')
      .transition()
      .call(this.xAxis)
      .selectAll('.bx--axis--x .tick text')
      .attr('y', axisOffset)
      .style('text-anchor', 'end')
      .style(
        'transform',
        `translate3d(-${axisOffset}px, 5px, 0) rotate(-60deg)`
      );

    this.svg
      .select('.bx--axis--y')
      .transition()
      .call(this.yAxis)
      .selectAll('text')
      .attr('x', -axisOffset);

    this.svg.select('.bx--axis--y .bx--graph-label').text(yAxisLabel);
    this.svg.select('.bx--axis--x .bx--graph-label').text(xAxisLabel);

    this.updateStyles();
  }

  updateStyles() {
    this.svg.selectAll('.bx--axis--y path').style('display', 'none');
    this.svg.selectAll('.bx--axis path').attr('stroke', '#5A6872');
    this.svg.selectAll('.tick line').attr('stroke', '#5A6872');
    this.svg.selectAll('.tick text').attr('fill', '#5A6872');
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

  initialRender() {
    const { data, width, height } = this.state;

    this.updateEmptyState(data);

    this.x = d3
      .scaleBand()
      .rangeRound([0, width])
      .domain(data.map(d => d[1]));

    this.y = d3
      .scaleLinear()
      .range([height, 0])
      .domain([0, d3.max(data, d => d[0])]);

    this.renderAxes();
    this.renderLabels();
    this.renderPoints();
  }

  renderAxes() {
    const { width, height, axisOffset, timeFormat } = this.state;

    const xAxis = d3
      .axisBottom()
      .scale(this.x)
      .tickSize(0)
      .tickFormat(d3.timeFormat(timeFormat));

    const yAxis = d3
      .axisLeft()
      .ticks(4)
      .tickSize(-width)
      .scale(this.y.nice());

    this.svg
      .append('g')
      .attr('class', 'bx--axis bx--axis--y')
      .attr('stroke-dasharray', '4')
      .call(yAxis)
      .selectAll('text')
      .attr('x', -axisOffset);

    this.svg
      .append('g')
      .attr('class', 'bx--axis bx--axis--x')
      .attr('transform', `translate(0, ${height})`)
      .call(xAxis)
      .selectAll('text')
      .attr('y', axisOffset)
      .style('text-anchor', 'end')
      .attr('transform', `rotate(-65)`);

    this.svg.selectAll('.bx--axis--y path').style('display', 'none');
    this.svg.selectAll('.bx--axis path').attr('stroke', '#5A6872');
    this.svg.selectAll('.tick line').attr('stroke', '#5A6872');
    this.svg.selectAll('.tick text').attr('fill', '#5A6872');
  }

  renderLabels() {
    const { labelOffset, xAxisLabel, yAxisLabel, height, width } = this.state;

    this.svg
      .select('.bx--axis--y')
      .append('text')
      .text(`${yAxisLabel}`)
      .attr('class', 'bx--graph-label')
      .attr(
        'transform',
        `translate(${-labelOffset}, ${height / 2}) rotate(-90)`
      );

    this.svg
      .select('.bx--axis--x')
      .append('text')
      .text(`${xAxisLabel}`)
      .attr('class', 'bx--graph-label')
      .attr('transform', `translate(${width / 2}, ${labelOffset})`);

    this.svg
      .selectAll('.bx--graph-label')
      .attr('font-size', '10')
      .attr('font-weight', '700')
      .attr('fill', '#5A6872')
      .attr('text-anchor', 'middle');
  }

  renderPoints() {
    const { data } = this.state;

    const barContainer = this.svg
      .append('g')
      .attr('class', 'scatter-container');

    barContainer
      .selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('data-circle', (d, i) => i)
      .attr('class', 'circle')
      .attr('cx', d => this.x(d[1]))
      .attr('cy', d => this.y(d[0]))
      .attr('fill', '#00a68f')
      .attr('r', 0)
      .transition()
      .delay((d, i) => i * 35)
      .attr('r', 4);

    barContainer
      .selectAll('circle')
      .on('mousemove', (d, i) => this.onMouseMove(d, i))
      .on('mouseout', (d, i) => this.onMouseOut(d, i));
  }

  onMouseOut(d, i) {
    const circle = this.svg.select(`circle[data-circle="${i}"]`);

    circle
      .transition()
      .duration(500)
      .attr('fill', '#00a68f');
  }

  onMouseMove(d, i) {
    const { timeFormat } = this.props;

    const mouseData = {
      data: d,
      index: i,
    };
    const circle = this.svg.select(`circle[data-circle="${i}"]`);
    circle.attr('fill', d3.color(circle.attr('fill')).darker());

    if (timeFormat) {
      const format = d3.timeFormat(timeFormat);
      Object.assign(mouseData, { label: format(d[1]) });
    }

    this.props.onHover(mouseData);
  }

  render() {
    const { containerId, id } = this.props;
    return (
      <div
        className="bx--graph-container"
        id={containerId}
        style={{ position: 'relative' }}>
        <p className="bx--scatter-plot-empty-text" />
        <svg id={id} ref={node => (this.svgNode = node)} />
        {/*<div id={`${id}-tooltip`} ref={id => (this.tooltipId = id)} />*/}
      </div>
    );
  }
}

ScatterPlot.propTypes = propTypes;
ScatterPlot.defaultProps = defaultProps;

export default ScatterPlot;
