import PropTypes from 'prop-types';
import React, { Component } from 'react';
import DataTooltip from '../DataTooltip/DataTooltip';
import * as d3 from 'd3';
import _ from 'lodash';
import ReactDOM from 'react-dom';

const propTypes = {
  data: PropTypes.array,
  radius: PropTypes.number,
  formatValue: PropTypes.func,
  formatTooltipData: PropTypes.func,
  id: PropTypes.string,
  color: PropTypes.array,
  onHover: PropTypes.func,
  showTotals: PropTypes.bool,
  showTooltip: PropTypes.bool,
  emptyText: PropTypes.string,
};

const defaultProps = {
  data: [['Gryffindor', 100]],
  radius: 96,
  formatValue: value => value,
  formatTooltipData: ({ data: [label, value], color }) => {
    return [
      {
        data: value,
        label: label,
        color: color,
      },
    ];
  },
  color: ['#00a68f', '#3b1a40', '#473793', '#3c6df0', '#56D2BB'],
  id: 'graph-container',
  emptyText:
    'There is currently no data available for the parameters selected. ' +
    'Please try a different combination.',
  showTotals: false,
  showTooltip: true,
};

class PieChart extends Component {
  componentDidMount() {
    const { id, emptyText } = this.props;

    this.emptyContainer = d3
      .select(`#${id} .bx--pie-graph-empty-text`)
      .text(emptyText)
      .style('position', 'absolute')
      .style('top', '50%')
      .style('left', '50%')
      .style('text-align', 'center')
      .style('width', '100%')
      .style('transform', 'translate(-50%, -50%)');

    this.renderSVG();
  }

  shouldComponentUpdate(nextProps) {
    return !_.isEqual(this.props, nextProps);
  }

  updateEmptyState(data) {
    const { id } = this.props;
    if (!this.emptyContainer) return;
    if (!data.length) {
      this.svg.style('opacity', '.3');
      d3.select(`#${id} .bx--pie-tooltip`).style('display', 'none');
      this.emptyContainer.style('display', 'inline-block');
    } else {
      this.svg.style('opacity', '1');
      d3.select(`#${id} .bx--pie-tooltip`).style('display', 'inline-block');
      this.emptyContainer.style('display', 'none');
    }
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

  renderSVG() {
    const {
      data,
      color,
      radius,
      formatValue,
      formatTooltipData,
      id,
      onHover,
      showTotals,
      showTooltip,
    } = this.props;

    if (this.svg) {
      const paths = this.svg.selectAll('path');
      if (paths.size()) {
        this.svg.remove();
      }
    }

    const width = radius * 2;
    const height = radius * 2 + 24;

    this.svg = d3
      .select(`#${id} svg`)
      .attr('width', width + 20)
      .attr('height', height)
      .append('g')
      .attr('class', 'group-container')
      .attr('transform', `translate(${width / 2 + 10}, ${height / 2})`);

    const tooltipId = this.tooltipId;
    const pie = d3
      .pie()
      .sort(null)
      .value(d => d[1]);
    const path = d3
      .arc()
      .outerRadius(radius)
      .innerRadius(radius - 30);
    const arcOver = d3
      .arc()
      .outerRadius(radius + 10)
      .innerRadius(radius - 30);
    const pathRadius = path.innerRadius()();

    const arc = this.svg
      .selectAll('.arc')
      .data(pie(data))
      .enter()
      .append('g')
      .attr('class', 'arc');

    const scaledColor = d3.scaleOrdinal(color);

    arc
      .append('path')
      .attr('fill', (d, i) => scaledColor(i))
      .attr('stroke-width', 2)
      .attr('stroke', '#FFFFFF')
      .transition()
      .ease(d3.easeQuadOut)
      .duration(650)
      .attrTween('d', d => {
        const i = d3.interpolate({ startAngle: 0, endAngle: 0 }, d);
        return t => path(i(t));
      });

    const totalAmount = data.reduce((acc, values) => {
      acc += values[1];
      return acc;
    }, 0);

    if (showTotals) {
      d3.select(`#${id} .bx--pie-tooltip`).style('display', 'block');
      d3.select(`#${id} .bx--pie-key`).text('Total');
      d3.select(`#${id} .bx--pie-value`).text(`${formatValue(totalAmount)}`);
    }

    this.updateEmptyState(data);
    const _this = this;

    this.svg
      .selectAll('path')
      .on('mouseover', function(d) {
        d3.select(this)
          .transition()
          .duration(500)
          .ease(d3.easeElastic)
          .attr('d', arcOver)
          .style('cursor', 'pointer');

        d3.select(`#${id} .bx--pie-tooltip`).style('display', 'inherit');
        d3.select(`#${id} .bx--pie-key`).text(`${d.data[0]}`);
        d3.select(`#${id} .bx--pie-value`).text(`${formatValue(d.data[1])}`);
        if (onHover) {
          onHover(true, d.data[0]);
        }
        if (showTooltip) {
          const tooltipData = formatTooltipData({
            data: d.data,
            color: scaledColor(d.index),
          });

          ReactDOM.render(<DataTooltip data={tooltipData} />, tooltipId);

          const pos = path.centroid(d);
          let [leftPos, topPos] = pos;
          let className = '';
          const halfRadius = pathRadius / 2;
          const tooltipSize = d3
            .select(tooltipId.children[0])
            .node()
            .getBoundingClientRect();
          topPos += (topPos / radius) * tooltipSize.height;
          leftPos += (leftPos / radius) * halfRadius;
          leftPos += ((leftPos / Math.abs(leftPos)) * tooltipSize.width) / 2;
          className += topPos > 0 ? 'bottom' : 'top';
          className += leftPos > 0 ? 'right' : 'left';
          const svgOffset = _this.getOffset(_this.svg.node());

          if (className.includes('right')) {
            const position =
              svgOffset.right +
              svgOffset.width / 2 -
              Math.abs(tooltipSize.width / 2) -
              Math.abs(leftPos);
            if (position < 0) {
              leftPos = leftPos - Math.abs(position);
            }
          } else if (className.includes('left')) {
            const position =
              svgOffset.left +
              svgOffset.width / 2 -
              Math.abs(tooltipSize.width / 2) -
              Math.abs(leftPos);
            if (position < 0) {
              leftPos = leftPos + Math.abs(position);
            }
          }

          d3.select(tooltipId)
            .style('position', 'absolute')
            .style('top', '50%')
            .style('left', '50%')
            .style('transform', 'translate(-50%, -50%)')
            .style('width', '1px')
            .style('height', '1px')
            .attr('class', className)
            .select('div')
            .style('position', 'absolute')
            .style('margin-left', (n, i, el) => `-${el[0].scrollWidth / 2}px`)
            .style('margin-top', (n, i, el) => `-${el[0].scrollHeight / 2}px`)
            .style('top', `${topPos}px`)
            .style('left', `${leftPos}px`)
            .style('width', 'auto');
        }
      })
      .on('mouseout', function mouseout() {
        const tooltipChild = _this.tooltipId.children[0];
        const handleMouseOut = mouseout.bind(this);
        if (showTooltip) {
          if (tooltipChild) {
            tooltipChild.removeEventListener('mouseout', handleMouseOut);
          }
          const { clientX, clientY } = d3.event || event;
          const tooltipOffset = _this.getOffset(tooltipChild);
          if (
            clientX >= tooltipOffset.left &&
            clientX <= tooltipOffset.left + tooltipOffset.width &&
            clientY >= tooltipOffset.top &&
            clientY <= tooltipOffset.top + tooltipOffset.height
          ) {
            tooltipChild.addEventListener('mouseout', handleMouseOut);
            return;
          }
        }
        d3.select(`#${id} .bx--pie-tooltip`).style(
          'display',
          !showTotals && 'none'
        );
        d3.select(this)
          .transition()
          .attr('d', path);
        if (showTotals) {
          d3.select(`#${id} .bx--pie-tooltip`).style('display', 'block');
          d3.select(`#${id} .bx--pie-key`).text('Total');
          d3.select(`#${id} .bx--pie-value`).text(formatValue(totalAmount));
        }

        if (onHover) {
          onHover(false);
        }
        ReactDOM.unmountComponentAtNode(tooltipId);
      });
  }

  render() {
    const { id, radius } = this.props;
    const tooltipStyles = {
      display: 'none',
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(calc(-50% + 10px), -50%)',
    };

    const keyStyles = {
      fontSize: '14px',
      fontWeight: '400',
      textAlign: 'center',
      color: '#5A6872',
    };

    const valueStyles = {
      fontSize: '29px',
      fontWeight: '300',
      textAlign: 'center',
      lineHeight: '1',
    };

    const width = radius * 2;
    const height = radius * 2 + 24;

    this.renderSVG();

    return (
      <div
        className="bx--graph-container"
        id={id}
        style={{ position: 'relative', width, height }}>
        <div style={{ position: 'relative', width }}>
          <p className="bx--pie-graph-empty-text" />
          <svg />
          <div className="bx--pie-tooltip" style={tooltipStyles}>
            <p className="bx--pie-value" style={valueStyles} />
            <p className="bx--pie-key" style={keyStyles} />
          </div>
          <div id="tooltip-div" ref={id => (this.tooltipId = id)} />
        </div>
      </div>
    );
  }
}

PieChart.propTypes = propTypes;
PieChart.defaultProps = defaultProps;

export default PieChart;
